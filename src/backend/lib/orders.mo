import Time "mo:core/Time";
import Storage "mo:caffeineai-object-storage/Storage";
import CommonTypes "../types/common";
import Char "mo:core/Char";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Text "mo:core/Text";
import Blob "mo:core/Blob";
import Runtime "mo:core/Runtime";
import Nat8 "mo:core/Nat8";
import Debug "mo:core/Debug";

module {
  public type Order = CommonTypes.Order;
  public type OrderId = CommonTypes.OrderId;
  public type CreateOrderRequest = CommonTypes.CreateOrderRequest;

  /// Base64 encoding table.
  private let base64Chars : [Char] = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/',
  ];

  /// Encode a Blob to Base64 text.
  private func base64Encode(data : Blob) : Text {
    let bytes = data.toArray();
    var result = "";
    var i = 0;
    let len = bytes.size();
    while (i < len) {
      let b1 = bytes[i].toNat();
      let b2 = if (i + 1 < len) { bytes[i + 1].toNat() } else { 0 };
      let b3 = if (i + 2 < len) { bytes[i + 2].toNat() } else { 0 };

      let idx1 = Nat8.toNat(Nat8.fromNat(b1) >> 2);
      let idx2 = Nat8.toNat(((Nat8.fromNat(b1) & Nat8.fromNat(0x03)) << 4) | (Nat8.fromNat(b2) >> 4));
      let idx3 = Nat8.toNat(((Nat8.fromNat(b2) & Nat8.fromNat(0x0F)) << 2) | (Nat8.fromNat(b3) >> 6));
      let idx4 = Nat8.toNat(Nat8.fromNat(b3) & Nat8.fromNat(0x3F));

      result #= base64Chars[idx1].toText();
      result #= base64Chars[idx2].toText();
      result #= if (i + 1 < len) { base64Chars[idx3].toText() } else { "=" };
      result #= if (i + 2 < len) { base64Chars[idx4].toText() } else { "=" };

      i += 3;
    };
    result;
  };

  /// Generate a unique order ID from a counter.
  public func generateOrderId(counter : Nat) : OrderId {
    "CC-" # counter.toText();
  };

  /// Calculate order amount in paise (INR * 100).
  /// Total = portraitPrice (or 0 if none) + addOnsAmount.
  /// Returns totalAmount and advanceAmount (totalAmount / 2 for #Advance mode).
  public func calculateAmount(portraitPrice : Nat, addOnsAmount : Nat, paymentMode : CommonTypes.PaymentMode) : { totalAmount : Nat; advanceAmount : Nat } {
    let totalAmount = portraitPrice + addOnsAmount;
    let advanceAmount = switch (paymentMode) {
      case (#Advance) { totalAmount / 2 };
      case (#Full) { totalAmount };
    };
    { totalAmount; advanceAmount };
  };

  /// Compute estimated delivery timestamp (~2 days from now).
  /// Compute estimated delivery timestamp (~2 days from now, kept for backwards compat).
  /// Compute estimated delivery timestamp based on order type.
  /// All order types now deliver in 4-5 days.
  public func estimatedDeliveryTime(now : Int, portraitType : ?Text, addOnsJson : ?Text) : Int {
    ignore (portraitType, addOnsJson);
    // Nanosecond constant: 24 * 60 * 60 * 1_000_000_000 = 86_400_000_000_000
    let oneDay : Int = 86_400_000_000_000;
    now + 5 * oneDay;
  };

  /// 3D miniature product name keywords (lowercase) used to detect 3D miniature orders.
  private let miniatureKeywords : [Text] = [
    "bobblehead",
    "mini figurine",
    "couple miniature",
    "wedding miniature",
    "family miniature",
    "pet miniature",
    "3d",
    "figurine",
    "miniature",
    "resin artwork",
    "face sculpture",
    "chibi",
  ];

  /// Return true if the add-ons JSON string contains any 3D miniature product.
  private func _hasMiniature(addOnsJson : ?Text) : Bool {
    switch (addOnsJson) {
      case (null) { false };
      case (?json) {
        if (json == "" or json == "[]") { return false };
        // Simple substring search on lowercased JSON
        let lower = textToLower(json);
        var found = false;
        for (kw in miniatureKeywords.vals()) {
          if (not found and textContains(lower, kw)) {
            found := true;
          };
        };
        found;
      };
    };
  };

  /// Naive ASCII lowercasing helper.
  private func textToLower(t : Text) : Text {
    var result = "";
    for (c in t.chars()) {
      let code = c.toNat32();
      if (code >= 65 and code <= 90) {
        result #= Char.fromNat32(code + 32).toText();
      } else {
        result #= c.toText();
      };
    };
    result;
  };

  /// Return true if text starts with the given prefix.
  private func textStartsWith(text : Text, prefix : Text) : Bool {
    if (prefix.size() > text.size()) { return false };
    let tArr = text.toArray();
    let pArr = prefix.toArray();
    var i = 0;
    while (i < pArr.size()) {
      if (tArr[i] != pArr[i]) { return false };
      i += 1;
    };
    true;
  };

  /// Return true if haystack contains needle (both already lowercased).
  private func textContains(haystack : Text, needle : Text) : Bool {
    let hLen = haystack.size();
    let nLen = needle.size();
    if (nLen == 0) { return true };
    if (nLen > hLen) { return false };
    let hArr = haystack.toArray();
    let nArr = needle.toArray();
    var i = 0;
    while (i + nLen <= hLen) {
      var match = true;
      var j = 0;
      while (j < nLen) {
        if (hArr[i + j] != nArr[j]) { match := false };
        j += 1;
      };
      if (match) { return true };
      i += 1;
    };
    false;
  };

  /// Compute the human-readable estimated delivery text based on order contents.
  /// All order types now show "4-5 days".
  public func computeDeliveryText(portraitType : ?Text, addOnsJson : ?Text) : Text {
    ignore (portraitType, addOnsJson);
    "4-5 days";
  };

  /// Build a new Order record with paymentStatus = #Pending (immediate storage on order creation).
  /// Build a new Order record with paymentStatus = #Pending (immediate storage on order creation).
  /// Build a new Order record with paymentStatus = #Pending (immediate storage on order creation).
  /// Build a new Order record with paymentStatus = #Pending (immediate storage on order creation).
  /// Build a new Order record with paymentStatus = #Pending.
  /// Convert a text portrait type to the PortraitType variant.
  private func portraitTypeFromText(t : Text) : CommonTypes.PortraitType {
    if (t == "Couple") { #Couple }
    else if (t == "Family") { #Family }
    else if (t == "Group") { #Group }
    else { #Single };
  };

  /// Build a new Order record with paymentStatus = #Pending.
  public func createOrderPending(
    orderId : OrderId,
    req : CreateOrderRequest,
    now : Int,
  ) : Order {
    let amounts = calculateAmount(req.portraitPrice, req.addOnsAmount, req.paymentMode);
    let deliveryText = computeDeliveryText(?req.portraitType, ?req.selectedAddOns);
    let estDelivery = estimatedDeliveryTime(now, ?req.portraitType, ?req.selectedAddOns);
    {
      orderId = orderId;
      customerName = req.customerName;
      customerEmail = req.customerEmail;
      customerPhone = req.customerPhone;
      portraitType = portraitTypeFromText(req.portraitType);
      artStyle = #CuteCartoon;
      notes = req.notes;
      photoKeys = req.photoKeys;
      paymentStatus = #Pending;
      orderStatus = #Received;
      createdAt = now;
      estimatedDelivery = estDelivery;
      estimatedDeliveryText = deliveryText;
      paymentRef = null;
      upiRef = null;
      razorpayPaymentId = null;
      razorpayOrderId = null;
      paymentMethod = ?req.paymentMethod;
      finalArtworkKey = null;
      amount = amounts.totalAmount;
      addOnsAmount = req.addOnsAmount;
      referredBy = if (req.referredBy == "") { null } else { ?req.referredBy };
      deliveryAddress = ?req.deliveryAddress;
      selectedAddOns = if (req.selectedAddOns == "") { null } else { ?req.selectedAddOns };
      portraitTypeText = if (req.portraitType == "") { null } else { ?req.portraitType };
      cartoonStyle = req.cartoonStyle;
      orderItems = req.orderItems;
      customerId = if (req.customerId == "") { null } else { ?req.customerId };
      isRead = false;
      portraitPrice = req.portraitPrice;
      address = req.address;
      pincode = req.pincode;
      is3DModel = req.is3DModel;
      customerAcknowledged = req.customerAcknowledged;
      paymentMode = req.paymentMode;
      advancePaid = 0;
      totalAmount = amounts.totalAmount;
      specialInstructions = req.specialInstructions;
    };
  };

  /// Create a Razorpay Order via HTTP outcall and return the order_id, amount, currency, and keyId.
  public func createRazorpayOrder(
    keyId : Text,
    keySecret : Text,
    amount : Nat,
    receipt : Text,
    transform : shared query OutCall.TransformationInput -> async OutCall.TransformationOutput,
  ) : async CommonTypes.RazorpayOrderDetails {
    if (keyId == "") {
      Runtime.trap("Razorpay keyId is empty");
    };
    if (keySecret == "") {
      Runtime.trap("Razorpay keySecret is empty");
    };
    if (amount == 0) {
      Runtime.trap("Razorpay order amount cannot be 0");
    };

    let url = "https://api.razorpay.com/v1/orders";
    let auth = keyId # ":" # keySecret;
    let authBlob = auth.encodeUtf8();
    let authEncoded = base64Encode(authBlob);
    let authHeader = "Basic " # authEncoded;
    let body = "{\"amount\":" # amount.toText() # ",\"currency\":\"INR\",\"receipt\":\"" # receipt # "\"}";
    let headers = [
      { name = "Content-Type"; value = "application/json" },
      { name = "Authorization"; value = authHeader },
    ];

    Debug.print("[Razorpay] Creating order with amount=" # amount.toText() # " receipt=" # receipt);

    let responseText = await OutCall.httpPostRequest(url, headers, body, transform);

    Debug.print("[Razorpay] Raw response: " # responseText);

    // Check for empty response
    if (responseText == "") {
      Runtime.trap("Razorpay API returned empty response");
    };

    // Check for Razorpay error response
    let errorField = extractJsonField(responseText, "error");
    switch (errorField) {
      case (?errDesc) {
        Runtime.trap("Razorpay API error: " # errDesc);
      };
      case (null) {};
    };

    // Also check for nested error description
    let errorDesc = extractJsonField(responseText, "description");
    switch (errorDesc) {
      case (?desc) {
        if (desc != "") {
          Debug.print("[Razorpay] Warning - description field found: " # desc);
        };
      };
      case (null) {};
    };

    let orderId = extractJsonField(responseText, "id");
    let responseAmount = extractJsonField(responseText, "amount");
    let responseCurrency = extractJsonField(responseText, "currency");
    let responseStatus = extractJsonField(responseText, "status");

    Debug.print("[Razorpay] Extracted orderId=" # debug_show(orderId) # " amount=" # debug_show(responseAmount) # " currency=" # debug_show(responseCurrency) # " status=" # debug_show(responseStatus));

    switch (orderId) {
      case (?rzpOrderId) {
        if (rzpOrderId == "") {
          Runtime.trap("Razorpay returned empty order id");
        };
        // Validate orderId starts with "order_" (Razorpay format)
        if (not textStartsWith(rzpOrderId, "order_")) {
          Debug.print("[Razorpay] Warning: orderId does not start with 'order_': " # rzpOrderId);
        };
        let amt = switch (responseAmount) {
          case (?a) {
            let parsed = parseNat(a);
            switch (parsed) {
              case (?n) { n };
              case (null) {
                Debug.print("[Razorpay] Warning: could not parse amount '" # a # "', using requested amount");
                amount;
              };
            };
          };
          case (null) {
            Debug.print("[Razorpay] Warning: no amount in response, using requested amount");
            amount;
          };
        };
        let curr = switch (responseCurrency) {
          case (?c) {
            if (c == "") {
              Debug.print("[Razorpay] Warning: empty currency in response, defaulting to INR");
              "INR";
            } else {
              c;
            };
          };
          case (null) {
            Debug.print("[Razorpay] Warning: no currency in response, defaulting to INR");
            "INR";
          };
        };
        let result = {
          orderId = rzpOrderId;
          amount = amt;
          currency = curr;
          keyId = keyId;
        };
        Debug.print("[Razorpay] Successfully created order: orderId=" # result.orderId # " keyId=" # result.keyId # " amount=" # result.amount.toText() # " currency=" # result.currency);
        result;
      };
      case (null) {
        Runtime.trap("Failed to create Razorpay order: missing 'id' field in response: " # responseText);
      };
    };
  };

  /// Parse a Nat from a Text string.
  private func parseNat(t : Text) : ?Nat {
    if (t == "") { return null };
    var result : Nat = 0;
    let arr = t.toArray();
    for (c in arr.vals()) {
      let code = c.toNat32();
      if (code >= 48 and code <= 57) {
        result := result * 10 + Nat32.toNat(code - 48);
      } else {
        return null;
      };
    };
    ?result;
  };

  /// Extract a string field value from a simple JSON response.
  /// Handles whitespace, escaped quotes, and numeric values.
  private func extractJsonField(json : Text, fieldName : Text) : ?Text {
    if (json == "") { return null };

    // Try string value: "fieldName":"value" (with optional whitespace)
    let stringPattern = "\"" # fieldName # "\"";
    let strStartIdx = indexOf(json, stringPattern);
    switch (strStartIdx) {
      case (?start) {
        let afterField = start + stringPattern.size();
        if (afterField >= json.size()) { return null };
        // Skip whitespace and colon
        var pos = afterField;
        let arr = json.toArray();
        while (pos < arr.size()) {
          let c = arr[pos].toNat32();
          if (c == 32 or c == 9 or c == 10 or c == 13) {
            pos += 1;
          } else if (c == 58) {
            pos += 1;
            break;
          } else {
            return null;
          };
        };
        // Skip whitespace after colon
        while (pos < arr.size()) {
          let c = arr[pos].toNat32();
          if (c == 32 or c == 9 or c == 10 or c == 13) {
            pos += 1;
          } else {
            break;
          };
        };
        if (pos >= arr.size()) { return null };
        // Check for opening quote
        if (arr[pos].toNat32() == 34) {
          pos += 1;
          var value = "";
          var escaped = false;
          while (pos < arr.size()) {
            let c = arr[pos];
            let code = c.toNat32();
            if (escaped) {
              value #= c.toText();
              escaped := false;
            } else if (code == 92) {
              escaped := true;
              value #= c.toText();
            } else if (code == 34) {
              // Closing quote found
              if (value == "") { return null } else { return ?value };
            } else {
              value #= c.toText();
            };
            pos += 1;
          };
          return null;
        } else {
          // Numeric value without quotes
          var end = pos;
          while (end < arr.size()) {
            let c = arr[end].toNat32();
            // Allow digits, minus sign, decimal point for numbers
            if (c >= 48 and c <= 57) {
              end += 1;
            } else {
              break;
            };
          };
          if (end > pos) {
            let value = substring(json, pos, end);
            if (value == "") { null } else { ?value };
          } else {
            null;
          };
        };
      };
      case (null) { null };
    };
  };

  /// Find the first occurrence of a substring in text.
  private func indexOf(text : Text, pattern : Text) : ?Nat {
    indexOfFrom(text, pattern, 0);
  };

  /// Find the first occurrence of a substring in text starting from a given index.
  private func indexOfFrom(text : Text, pattern : Text, from : Nat) : ?Nat {
    let tArr = text.toArray();
    let pArr = pattern.toArray();
    let tLen = tArr.size();
    let pLen = pArr.size();
    if (pLen == 0) { return ?from };
    if (from + pLen > tLen) { return null };
    var i = from;
    while (i + pLen <= tLen) {
      var match = true;
      var j = 0;
      while (j < pLen) {
        if (tArr[i + j] != pArr[j]) { match := false };
        j += 1;
      };
      if (match) { return ?i };
      i += 1;
    };
    null;
  };

  /// Extract a substring from start (inclusive) to end (exclusive).
  private func substring(text : Text, start : Nat, end : Nat) : Text {
    let arr = text.toArray();
    var result = "";
    var i = start;
    while (i < end and i < arr.size()) {
      result #= arr[i].toText();
      i += 1;
    };
    result;
  };

  /// Build a new Order record with paymentStatus = #Paid.
  public func createOrderPaid(
    orderId : OrderId,
    req : CreateOrderRequest,
    now : Int,
    upiRef : ?Text,
  ) : Order {
    let pending = createOrderPending(orderId, req, now);
    { pending with paymentStatus = #Paid; upiRef = upiRef; paymentRef = upiRef; advancePaid = pending.totalAmount };
  };

  /// Update order status.
  public func setOrderStatus(order : Order, status : CommonTypes.OrderStatus) : Order {
    { order with orderStatus = status };
  };

  /// Confirm payment for an order, handling both #Full and #Advance modes.
  public func confirmPayment(order : Order, paidAmount : Nat, razorpayPaymentId : ?Text, razorpayOrderId : ?Text) : Order {
    switch (order.paymentMode) {
      case (#Advance) {
        { order with
          paymentStatus = #AdvancePaid;
          advancePaid = paidAmount;
          razorpayPaymentId = razorpayPaymentId;
          razorpayOrderId = razorpayOrderId;
          paymentRef = razorpayPaymentId;
        };
      };
      case (#Full) {
        { order with
          paymentStatus = #Paid;
          advancePaid = order.totalAmount;
          razorpayPaymentId = razorpayPaymentId;
          razorpayOrderId = razorpayOrderId;
          paymentRef = razorpayPaymentId;
        };
      };
    };
  };

  /// Set final artwork key on the order.
  public func setFinalArtwork(order : Order, artworkKey : Storage.ExternalBlob) : Order {
    { order with finalArtworkKey = ?artworkKey; orderStatus = #Completed };
  };

  /// Update only the paymentStatus field of an order.
  public func setPaymentStatus(order : Order, paymentStatus : CommonTypes.PaymentStatus) : Order {
    { order with paymentStatus = paymentStatus };
  };

  /// Convert Order to a public-safe representation (same type here since no internal mutations).
  /// Convert Order to a public-safe representation.
  public func toPublic(order : Order) : Order {
    order;
  };
};
