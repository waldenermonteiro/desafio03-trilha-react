import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productExistInCart = cart.filter((product) => product.id === productId);
      
      if (productExistInCart.length > 0) {
        let productAmount = productExistInCart[0].amount
        await updateProductAmount({ productId: productId, amount: ++productAmount });
      } else {
        const { data } = await api.get(`products/${productId}`);
        const chosenProduct = data;

        setCart([...cart, { ...chosenProduct, amount: 1 }]);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify([...cart, { ...chosenProduct, amount: 1 }]));
      }
    } catch {
      toast.error("Erro na adição do produto");
      return;
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const verifyIfProductExistInCart = cart.filter((product) => product.id === productId);

      if (!verifyIfProductExistInCart.length) {
        throw new Error("Produto não existe");
      }
      const removeProductInCart = cart.filter((product) => product.id !== productId);

      setCart(removeProductInCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(removeProductInCart));
    } catch {
      toast.error("Erro na remoção do produto");
      return;
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {
      const { data } = await api.get(`stock/${productId}`);
      const AmountOfProduct = data.amount;
      if (amount <= 0) {
        return;
      } else if (amount > AmountOfProduct) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      } else {
        const updateCart = cart.map((product) => {
          if (product.id === productId) {
            product.amount = amount;
          }
          return product;
        });

        setCart(updateCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return <CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
