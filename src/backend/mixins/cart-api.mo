import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import CartTypes "../types/cart";
import CartLib "../lib/cart";

mixin (
  accessControlState : AccessControl.AccessControlState,
  carts : Map.Map<Text, CartTypes.Cart>,
  cartSessionIndex : Map.Map<Text, Text>,
  cartCustomerIndex : Map.Map<Text, Text>,
  cartState : { var nextCartId : Nat }
) {

  public shared ({ caller }) func createCart(sessionId : Text) : async CartTypes.CartResponse {
    ignore caller;
    let cartId = CartLib.generateCartId(cartState.nextCartId);
    cartState.nextCartId += 1;

    let now = Time.now();
    let nowText = now.toText();
    let cart : CartTypes.Cart = {
      id = cartId;
      customerId = null;
      sessionId = sessionId;
      items = [];
      createdAt = nowText;
      updatedAt = nowText;
    };

    carts.add(cartId, cart);
    cartSessionIndex.add(sessionId, cartId);

    CartLib.buildSuccessResponse(cart)
  };

  public shared ({ caller }) func getCart(sessionId : Text, customerId : ?Text) : async CartTypes.CartResponse {
    ignore caller;

    // First try to find by customerId if provided
    switch (customerId) {
      case (?cid) {
        switch (cartCustomerIndex.get(cid)) {
          case (?cartId) {
            switch (carts.get(cartId)) {
              case (?cart) { return CartLib.buildSuccessResponse(cart) };
              case null {};
            };
          };
          case null {};
        };
      };
      case null {};
    };

    // Then try by sessionId
    switch (cartSessionIndex.get(sessionId)) {
      case (?cartId) {
        switch (carts.get(cartId)) {
          case (?cart) { return CartLib.buildSuccessResponse(cart) };
          case null {};
        };
      };
      case null {};
    };

    // If no cart found, create one
    let cartId = CartLib.generateCartId(cartState.nextCartId);
    cartState.nextCartId += 1;

    let now = Time.now();
    let nowText = now.toText();
    let cart : CartTypes.Cart = {
      id = cartId;
      customerId = customerId;
      sessionId = sessionId;
      items = [];
      createdAt = nowText;
      updatedAt = nowText;
    };

    carts.add(cartId, cart);
    cartSessionIndex.add(sessionId, cartId);
    switch (customerId) {
      case (?cid) { cartCustomerIndex.add(cid, cartId) };
      case null {};
    };

    CartLib.buildSuccessResponse(cart)
  };

  public shared ({ caller }) func addToCart(sessionId : Text, customerId : ?Text, item : CartTypes.CartItem) : async CartTypes.CartResponse {
    ignore caller;

    let cartResult = await getCart(sessionId, customerId);
    switch (cartResult.cart) {
      case (?existingCart) {
        let updatedCart = CartLib.addItemToCart(existingCart, item);
        let now = Time.now();
        let finalCart = { updatedCart with updatedAt = now.toText() };
        carts.add(finalCart.id, finalCart);
        CartLib.buildSuccessResponse(finalCart)
      };
      case null {
        CartLib.buildErrorResponse("Failed to retrieve cart")
      };
    }
  };

  public shared ({ caller }) func updateQuantity(sessionId : Text, customerId : ?Text, productId : Text, quantity : Nat) : async CartTypes.CartResponse {
    ignore caller;

    let cartResult = await getCart(sessionId, customerId);
    switch (cartResult.cart) {
      case (?existingCart) {
        let updatedCart = CartLib.updateItemQuantity(existingCart, productId, quantity);
        let now = Time.now();
        let finalCart = { updatedCart with updatedAt = now.toText() };
        carts.add(finalCart.id, finalCart);
        CartLib.buildSuccessResponse(finalCart)
      };
      case null {
        CartLib.buildErrorResponse("Failed to retrieve cart")
      };
    }
  };

  public shared ({ caller }) func removeFromCart(sessionId : Text, customerId : ?Text, productId : Text) : async CartTypes.CartResponse {
    ignore caller;

    let cartResult = await getCart(sessionId, customerId);
    switch (cartResult.cart) {
      case (?existingCart) {
        let updatedCart = CartLib.removeItemFromCart(existingCart, productId);
        let now = Time.now();
        let finalCart = { updatedCart with updatedAt = now.toText() };
        carts.add(finalCart.id, finalCart);
        CartLib.buildSuccessResponse(finalCart)
      };
      case null {
        CartLib.buildErrorResponse("Failed to retrieve cart")
      };
    }
  };

  public shared ({ caller }) func clearCart(sessionId : Text, customerId : ?Text) : async CartTypes.CartResponse {
    ignore caller;

    let cartResult = await getCart(sessionId, customerId);
    switch (cartResult.cart) {
      case (?existingCart) {
        let updatedCart = CartLib.clearCartItems(existingCart);
        let now = Time.now();
        let finalCart = { updatedCart with updatedAt = now.toText() };
        carts.add(finalCart.id, finalCart);
        CartLib.buildSuccessResponse(finalCart)
      };
      case null {
        CartLib.buildErrorResponse("Failed to retrieve cart")
      };
    }
  };

  public shared ({ caller }) func mergeCarts(fromSessionId : Text, toCustomerId : Text) : async CartTypes.CartResponse {
    ignore caller;

    // Get the session cart
    let sessionCartResult = await getCart(fromSessionId, null);

    // Get or create the customer cart
    let customerCartResult = await getCart("", ?toCustomerId);

    switch (sessionCartResult.cart, customerCartResult.cart) {
      case (?sessionCart, ?customerCart) {
        if (sessionCart.id == customerCart.id) {
          // Same cart, nothing to merge
          return CartLib.buildSuccessResponse(customerCart);
        };

        let mergedCart = CartLib.mergeCartItems(sessionCart, customerCart);
        let now = Time.now();
        let finalCart = { mergedCart with updatedAt = now.toText() };

        // Remove the old session cart
        carts.remove(sessionCart.id);
        cartSessionIndex.remove(fromSessionId);

        // Update the customer cart
        carts.add(finalCart.id, finalCart);
        cartCustomerIndex.add(toCustomerId, finalCart.id);

        CartLib.buildSuccessResponse(finalCart)
      };
      case (_, _) {
        CartLib.buildErrorResponse("Failed to retrieve carts for merging")
      };
    }
  };
};
