import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  products : Map.Map<Text, CommonTypes.AddonProduct>,
  productsState : { var nextProductId : Nat; var seeded : Bool; var maxDisplayOrder : Nat },
) {

  /// List all products — public, no auth required.
  /// List all products sorted ascending by displayOrder — public, no auth required.
  public query func listProducts() : async [CommonTypes.AddonProduct] {
    let all = products.values().toArray();
    all.sort(func(a, b) { Nat.compare(a.displayOrder, b.displayOrder) });
  };

  /// Get a single product by ID — public, no auth required.
  public query func getProduct(id : Text) : async ?CommonTypes.AddonProduct {
    products.get(id);
  };

  /// Add a new product — admin only.
  /// Add a new product — admin only. Assigns displayOrder = maxDisplayOrder + 1.
  public shared ({ caller }) func addProduct(
    name : Text,
    price : Nat,
    category : Text,
    imageUrl : Text,
    codEnabled : Bool,
    description : ?Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    productsState.nextProductId += 1;
    productsState.maxDisplayOrder += 1;
    let id = "prod_" # productsState.nextProductId.toText();
    let product : CommonTypes.AddonProduct = { id; name; price; category; imageUrl; displayOrder = productsState.maxDisplayOrder; codEnabled; description };
    products.add(id, product);
    id;
  };

  /// Update an existing product — admin only.
  /// Toggle COD availability for a product — admin only.
  public shared ({ caller }) func toggleProductCOD(id : Text, codEnabled : Bool) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (products.get(id)) {
      case (null) { "Error: Product not found" };
      case (?existing) {
        products.add(id, { existing with codEnabled });
        "COD setting updated successfully";
      };
    };
  };

  /// Update an existing product — admin only.
  public shared ({ caller }) func updateProduct(
    id : Text,
    name : Text,
    price : Nat,
    category : Text,
    imageUrl : Text,
    codEnabled : Bool,
    description : ?Text,
  ) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (products.get(id)) {
      case (null) { false };
      case (?existing) {
        products.add(id, { existing with name; price; category; imageUrl; codEnabled; description });
        true;
      };
    };
  };

  /// Delete a product by ID — admin only.
  public shared ({ caller }) func deleteProduct(id : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (products.get(id)) {
      case (null) { false };
      case (?_) {
        products.remove(id);
        true;
      };
    };
  };

  /// Seed the default 25 add-on products if not already seeded or if map is empty — admin only.
  public shared ({ caller }) func seedDefaultProducts() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    if (productsState.seeded and products.size() > 0) { return 0 };
    let defaults = defaultProducts();
    for (p in defaults.vals()) {
      products.add(p.id, p);
    };
    productsState.seeded := true;
    // Re-sync maxDisplayOrder after re-seed
    var maxOrd : Nat = 0;
    for (p in products.values()) {
      if (p.displayOrder > maxOrd) { maxOrd := p.displayOrder };
    };
    productsState.maxDisplayOrder := maxOrd;
    defaults.size();
  };

  /// Reorder products: accepts an array of product IDs in the desired display order
  /// and assigns sequential displayOrder values (1, 2, 3...) accordingly — admin only.
  public shared ({ caller }) func reorderProducts(orderedIds : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    var order : Nat = 0;
    for (id in orderedIds.vals()) {
      order += 1;
      switch (products.get(id)) {
        case (null) {}; // skip unknown IDs
        case (?p) {
          products.add(id, { p with displayOrder = order });
        };
      };
    };
    productsState.maxDisplayOrder := order;
  };

  /// Move a product one position up (lower displayOrder) — admin only.
  public shared ({ caller }) func moveProductUp(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    let all = products.values().toArray().sort(
      func(a, b) { Nat.compare(a.displayOrder, b.displayOrder) },
    );
    var idx : Nat = 0;
    var found = false;
    label search for (p in all.vals()) {
      if (p.id == id) { found := true; break search };
      idx += 1;
    };
    if (not found or idx == 0) return; // already first or not found
    let above = all[idx - 1];
    let current = all[idx];
    products.add(current.id, { current with displayOrder = above.displayOrder });
    products.add(above.id, { above with displayOrder = current.displayOrder });
  };

  /// Move a product one position down (higher displayOrder) — admin only.
  public shared ({ caller }) func moveProductDown(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    let all = products.values().toArray().sort(
      func(a, b) { Nat.compare(a.displayOrder, b.displayOrder) },
    );
    var idx : Nat = 0;
    var found = false;
    label search for (p in all.vals()) {
      if (p.id == id) { found := true; break search };
      idx += 1;
    };
    if (not found or idx + 1 >= all.size()) return; // already last or not found
    let below = all[idx + 1];
    let current = all[idx];
    products.add(current.id, { current with displayOrder = below.displayOrder });
    products.add(below.id, { below with displayOrder = current.displayOrder });
  };

  /// Upload a product image and return the permanent URL — admin only.
  /// Update the image URL for an existing product — admin only.
  /// The frontend uploads the image via the object-storage extension and passes the resulting URL here.
  public shared ({ caller }) func updateProductImage(id : Text, imageUrl : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admins only");
    };
    switch (products.get(id)) {
      case (null) { false };
      case (?existing) {
        products.add(id, { existing with imageUrl });
        true;
      };
    };
  };

  // --- Private helpers ---

  private func defaultProducts() : [CommonTypes.AddonProduct] {
    [
      // Merchandise
      { id = "prod_1";  name = "Custom Printed T-Shirts";         price = 69900;   category = "Merchandise";     imageUrl = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"; displayOrder = 1; codEnabled = false; description = null },
      { id = "prod_2";  name = "Personalized Coffee Mugs";        price = 39900;   category = "Merchandise";     imageUrl = "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop"; displayOrder = 2; codEnabled = false; description = null },
      { id = "prod_3";  name = "Custom Tote Bags";                price = 59900;   category = "Merchandise";     imageUrl = "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop"; displayOrder = 3; codEnabled = false; description = null },
      // Prints & Frames
      { id = "prod_4";  name = "Premium HD Portrait Print";       price = 79900;   category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1574182245530-967d9b3831af?w=400&h=400&fit=crop"; displayOrder = 4; codEnabled = false; description = null },
      { id = "prod_5";  name = "Matte Finish Portrait Frame";     price = 129900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop"; displayOrder = 5; codEnabled = false; description = null },
      { id = "prod_6";  name = "Glossy Finish Portrait Print";    price = 149900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=400&h=400&fit=crop"; displayOrder = 6; codEnabled = false; description = null },
      { id = "prod_7";  name = "Canvas Print with Wooden Frame";  price = 219900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=400&fit=crop"; displayOrder = 7; codEnabled = false; description = null },
      { id = "prod_8";  name = "Black Matte Wooden Frame";        price = 199900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1582053433976-25c00369fc93?w=400&h=400&fit=crop"; displayOrder = 8; codEnabled = false; description = null },
      { id = "prod_9";  name = "White Glossy Modern Frame";       price = 199900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=400&fit=crop"; displayOrder = 9; codEnabled = false; description = null },
      { id = "prod_10"; name = "Vintage Wooden Portrait Frame";   price = 249900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=400&fit=crop"; displayOrder = 10; codEnabled = false; description = null },
      { id = "prod_11"; name = "Floating Frame Wall Art";         price = 279900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=400&h=400&fit=crop"; displayOrder = 11; codEnabled = false; description = null },
      { id = "prod_12"; name = "3D Wooden Frame with LED Lights"; price = 449900;  category = "Prints & Frames"; imageUrl = "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=400&h=400&fit=crop"; displayOrder = 12; codEnabled = false; description = null },
      // LED & Glass
      { id = "prod_13"; name = "Neon Light Portrait Frame";       price = 549900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=400&fit=crop"; displayOrder = 13; codEnabled = false; description = null },
      { id = "prod_14"; name = "Personalized Night Lamp Frame";   price = 349900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&seed=14"; displayOrder = 14; codEnabled = false; description = null },
      { id = "prod_15"; name = "LED Light Frame";                 price = 429900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=400&fit=crop"; displayOrder = 15; codEnabled = false; description = null },
      { id = "prod_16"; name = "Acrylic Glass Frame";             price = 329900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&h=400&fit=crop"; displayOrder = 16; codEnabled = false; description = null },
      { id = "prod_17"; name = "Neon Light Frame";                price = 529900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1609097960451-0e6d4ee2c8e9?w=400&h=400&fit=crop"; displayOrder = 17; codEnabled = false; description = null },
      { id = "prod_18"; name = "Crystal Glass Block";             price = 499900;  category = "LED & Glass";     imageUrl = "https://images.unsplash.com/photo-1601751818941-571144562871?w=400&h=400&fit=crop"; displayOrder = 18; codEnabled = false; description = null },
      // 3D Models
      { id = "prod_19"; name = "Custom Bobblehead 3D Model";      price = 699900;  category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=400&h=400&fit=crop"; displayOrder = 19; codEnabled = false; description = null },
      { id = "prod_20"; name = "Bobblehead Model";                price = 599900;  category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=400&h=400&fit=crop"; displayOrder = 20; codEnabled = false; description = null },
      { id = "prod_21"; name = "Mini Figurine";                   price = 399900;  category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"; displayOrder = 21; codEnabled = false; description = null },
      { id = "prod_22"; name = "Couple Miniature";                price = 899900;  category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=400&fit=crop"; displayOrder = 22; codEnabled = false; description = null },
      { id = "prod_23"; name = "Wedding Miniature";               price = 1299900; category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=400&fit=crop"; displayOrder = 23; codEnabled = false; description = null },
      { id = "prod_24"; name = "Family Miniature (4 Members)";    price = 1499900; category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1484244233201-29892afe6a2c?w=400&h=400&fit=crop"; displayOrder = 24; codEnabled = false; description = null },
      { id = "prod_25"; name = "Pet Miniature";                   price = 449900;  category = "3D Models";       imageUrl = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop"; displayOrder = 25; codEnabled = false; description = null },
    ];
  };
};
