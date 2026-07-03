module {
  public type CartItem = {
    productId : Text;
    name : Text;
    price : Nat;
    quantity : Nat;
    image : Text;
    flowType : Text;
    itemImages : [Text];
  };

  public type Cart = {
    id : Text;
    customerId : ?Text;
    sessionId : Text;
    items : [CartItem];
    createdAt : Text;
    updatedAt : Text;
  };

  public type CartResponse = {
    success : Bool;
    cart : ?Cart;
    message : Text;
  };

  public type AddToCartRequest = {
    productId : Text;
    name : Text;
    price : Nat;
    quantity : Nat;
    image : Text;
    flowType : Text;
    itemImages : [Text];
  };

  public type UpdateCartRequest = {
    productId : Text;
    quantity : Nat;
  };
};
