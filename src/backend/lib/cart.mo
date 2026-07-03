import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import CartTypes "../types/cart";

module {
  public type CartItem = CartTypes.CartItem;
  public type Cart = CartTypes.Cart;
  public type CartResponse = CartTypes.CartResponse;

  public func generateCartId(nextId : Nat) : Text {
    "cart_" # nextId.toText()
  };

  public func createEmptyCart(id : Text, sessionId : Text) : Cart {
    let now = "0"; // Will be set by caller with actual timestamp
    {
      id = id;
      customerId = null;
      sessionId = sessionId;
      items = [];
      createdAt = now;
      updatedAt = now;
    }
  };

  public func addItemToCart(cart : Cart, item : CartItem) : Cart {
    let _existingIndex = cart.items.findIndex(
      func(existingItem) { existingItem.productId == item.productId }
    );

    let newItems = switch (_existingIndex) {
      case (?_index) {
        cart.items.map(
          func(existingItem) {
            if (existingItem.productId == item.productId) {
              { existingItem with quantity = existingItem.quantity + item.quantity }
            } else {
              existingItem
            }
          }
        )
      };
      case null {
        cart.items.concat([item])
      };
    };

    { cart with items = newItems; updatedAt = "0" }
  };

  public func updateItemQuantity(cart : Cart, productId : Text, quantity : Nat) : Cart {
    if (quantity == 0) {
      return removeItemFromCart(cart, productId)
    };

    let newItems = cart.items.map(
      func(item) {
        if (item.productId == productId) {
          { item with quantity = quantity }
        } else {
          item
        }
      }
    );

    { cart with items = newItems; updatedAt = "0" }
  };

  public func removeItemFromCart(cart : Cart, productId : Text) : Cart {
    let newItems = cart.items.filter(
      func(item) { item.productId != productId }
    );

    { cart with items = newItems; updatedAt = "0" }
  };

  public func clearCartItems(cart : Cart) : Cart {
    { cart with items = []; updatedAt = "0" }
  };

  public func getCartItemCount(cart : Cart) : Nat {
    var count = 0;
    for (item in cart.items.vals()) {
      count += item.quantity;
    };
    count
  };

  public func getCartTotal(cart : Cart) : Nat {
    var total = 0;
    for (item in cart.items.vals()) {
      total += item.price * item.quantity;
    };
    total
  };

  public func findCartBySessionId(carts : Map.Map<Text, Cart>, sessionId : Text) : ?Cart {
    for ((id, cart) in carts.entries()) {
      if (cart.sessionId == sessionId) {
        return ?cart;
      };
    };
    null
  };

  public func findCartByCustomerId(carts : Map.Map<Text, Cart>, customerId : Text) : ?Cart {
    for ((id, cart) in carts.entries()) {
      switch (cart.customerId) {
        case (?cid) {
          if (cid == customerId) {
            return ?cart;
          };
        };
        case null {};
      };
    };
    null
  };

  public func mergeCartItems(fromCart : Cart, toCart : Cart) : Cart {
    var mergedItems = toCart.items;
    for (item in fromCart.items.vals()) {
      let _existingIndex = mergedItems.findIndex(
        func(existingItem) { existingItem.productId == item.productId }
      );
      switch (_existingIndex) {
        case (?_index) {
          mergedItems := mergedItems.map(
            func(existingItem) {
              if (existingItem.productId == item.productId) {
                { existingItem with quantity = existingItem.quantity + item.quantity }
              } else {
                existingItem
              }
            }
          )
        };
        case null {
          mergedItems := mergedItems.concat([item])
        };
      };
    };

    { toCart with items = mergedItems; updatedAt = "0" }
  };

  public func buildSuccessResponse(cart : Cart) : CartResponse {
    {
      success = true;
      cart = ?cart;
      message = "Success";
    }
  };

  public func buildErrorResponse(message : Text) : CartResponse {
    {
      success = false;
      cart = null;
      message = message;
    }
  };
};
