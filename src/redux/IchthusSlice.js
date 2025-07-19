import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const initialState = {
  // Auth state
  isLoggedIn: false,
  email: null,
  userID: null,
  fullName: null,
  imgUrl: null,
  admin: null,
  roleName: null,
  roleId: null,

  // Other state
  posProducts: [], // New array for POS products
  checkedBrands: [],
  checkedCategories: [],
  checkedCategoriesTwo: [],
  checkedCategoriesThree: [],
  checkedCategoriesFour: [],
  checkedCategoriesFive: [],
  lastModifiedProduct: null,
  lastModifiedProducts: [],
  selectedCustomer: null,
  refreshProducts: false,
  existingLocation: null,
};

export const IchthusSlice = createSlice({
  name: "Ichthus",
  initialState,
  reducers: {
    // Auth reducers
    SET_ACTIVE_USER: (state, action) => {
      console.log("SET_ACTIVE_USER reducer executed");
      console.log(action.payload);
      const { email, userID, fullName, imgUrl, admin, roleName, roleId } =
        action.payload;

      state.isLoggedIn = true;
      state.email = email;
      state.userID = userID;
      state.fullName = fullName;
      state.imgUrl = imgUrl;
      state.admin = admin;
      state.roleName = roleName;
      state.roleId = roleId;
    },

    REMOVE_ACTIVE_USER: (state) => {
      console.log("REMOVE_ACTIVE_USER reducer executed");
      state.isLoggedIn = false;
      state.email = null;
      state.userID = null;
      state.fullName = null;
      state.imgUrl = null;
      state.admin = false;
      state.roleName = null;
      state.roleId = null;
      state.posProducts = [];
      state.lastModifiedProducts = [];
      state.selectedCustomer = null;
    },

    addToPos: (state, action) => {
      const item = state.posProducts.find(
        (item) => item.id === action.payload.id
      );
      const incomingQuantity = action.payload.quantity || 1;
      const maxQuantity = action.payload.maxQuantity;

      if (incomingQuantity < 1) {
        toast.error("Quantity must be at least 1.");
        return; // Prevent addition if quantity is less than 1
      }

      if (incomingQuantity > maxQuantity) {
        toast.error(
          `Quantity cannot exceed the maximum quantity of ${maxQuantity}.`
        );
        return; // Prevent addition if quantity exceeds maxQuantity
      }

      if (item) {
        const newQuantity = item.quantity + incomingQuantity;
        if (newQuantity > maxQuantity) {
          toast.error(
            `Total quantity cannot exceed the maximum quantity of ${maxQuantity}.`
          );
          return;
        }
        item.quantity = newQuantity;
      } else {
        state.posProducts.push({
          ...action.payload,
          quantity: incomingQuantity,
        });
      }

      const existingLastModified = state.lastModifiedProducts.find(
        (p) => p.id === action.payload.id
      );

      if (existingLastModified) {
        existingLastModified.quantity = item ? item.quantity : incomingQuantity;
      } else {
        state.lastModifiedProducts.push({
          id: action.payload.id,
          quantity: item ? item.quantity : incomingQuantity,
        });
      }

      state.lastModifiedProduct = {
        id: action.payload.id,
        quantity: item ? item.quantity : incomingQuantity,
      };

      toast.success("Product added to POS");
    },

    setExistingLocation: (state, action) => {
      state.existingLocation = action.payload;
    },

    increasePosQuantity: (state, action) => {
      const item = state.posProducts.find(
        (item) => item.id === action.payload.id
      );
      if (item) {
        const maxQuantity = item.maxQuantity;
        if (item.quantity + 1 > maxQuantity) {
          toast.error(
            `Quantity cannot exceed the maximum quantity of ${maxQuantity}.`
          );
          return;
        }
        item.quantity++;
        const existingLastModified = state.lastModifiedProducts.find(
          (p) => p.id === item.id
        );

        if (existingLastModified) {
          existingLastModified.quantity = item.quantity;
        } else {
          state.lastModifiedProducts.push({
            id: item.id,
            quantity: item.quantity,
          });
        }

        state.lastModifiedProduct = { id: item.id, quantity: item.quantity };
      }
    },

    decreasePosQuantity: (state, action) => {
      const item = state.posProducts.find(
        (item) => item.id === action.payload.id
      );
      if (item && item.quantity > 1) {
        item.quantity--;
        const existingLastModified = state.lastModifiedProducts.find(
          (p) => p.id === item.id
        );

        if (existingLastModified) {
          existingLastModified.quantity = item.quantity;
        } else {
          state.lastModifiedProducts.push({
            id: item.id,
            quantity: item.quantity,
          });
        }

        state.lastModifiedProduct = { id: item.id, quantity: item.quantity };
      }
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const product = state.posProducts.find((item) => item.id === id);
      if (product) {
        const maxQuantity = product.maxQuantity;
        if (quantity < 1) {
          toast.error("Quantity must be at least 1.");
          return;
        }
        if (quantity > maxQuantity) {
          toast.error(
            `Quantity cannot exceed the maximum quantity of ${maxQuantity}.`
          );
          return;
        }

        product.quantity = quantity;
        const existingLastModified = state.lastModifiedProducts.find(
          (p) => p.id === id
        );

        if (existingLastModified) {
          existingLastModified.quantity = product.quantity;
        } else {
          state.lastModifiedProducts.push({ id, quantity: product.quantity });
        }

        state.lastModifiedProduct = { id, quantity: product.quantity };
      }
    },

    updateDiscount: (state, action) => {
      const { id, discount } = action.payload;
      const product = state.posProducts.find((item) => item.id === id);
      if (product) {
        const maxDiscount = product.quantity * product.price;
        product.discount = Math.max(0, Math.min(discount, maxDiscount)); // Clamp value
      }
    },

    deleteItemPos: (state, action) => {
      const deletedProduct = state.posProducts.find(
        (item) => item.id === action.payload
      );

      // Remove the product from posProducts
      state.posProducts = state.posProducts.filter(
        (item) => item.id !== action.payload
      );

      if (deletedProduct) {
        // Remove previous instances of the deleted product in lastModifiedProducts
        state.lastModifiedProducts = state.lastModifiedProducts.filter(
          (item) => item.id !== deletedProduct.id
        );

        // Add the deletion entry with quantity 0
        const newLastModifiedProduct = {
          id: deletedProduct.id,
          quantity: 0, // Mark as deleted
        };
        state.lastModifiedProduct = newLastModifiedProduct;
        state.lastModifiedProducts.push(newLastModifiedProduct);
      }

      toast.error("Product removed from POS");
    },

    toggleBrand: (state, action) => {
      const brand = action.payload;
      const isBrandChecked = state.checkedBrands.some((b) => b.id === brand.id);
      if (isBrandChecked) {
        state.checkedBrands = state.checkedBrands.filter(
          (b) => b.id !== brand.id
        );
      } else {
        state.checkedBrands.push(brand);
      }
    },
    toggleCategory: (state, action) => {
      const category = action.payload;
      const isCategoryChecked = state.checkedCategories.some(
        (b) => b.id === category.id
      );
      if (isCategoryChecked) {
        state.checkedCategories = state.checkedCategories.filter(
          (b) => b.id !== category.id
        );
      } else {
        state.checkedCategories.push(category);
      }
    },
    toggleCategoryTwo: (state, action) => {
      const categoryTwo = action.payload;
      const isCategoryTwoChecked = state.checkedCategoriesTwo.some(
        (b) => b.id === categoryTwo.id
      );
      if (isCategoryTwoChecked) {
        state.checkedCategoriesTwo = state.checkedCategoriesTwo.filter(
          (b) => b.id !== categoryTwo.id
        );
      } else {
        state.checkedCategoriesTwo.push(categoryTwo);
      }
    },
    toggleCategoryThree: (state, action) => {
      const categoryThree = action.payload;
      const isCategoryThreeChecked = state.checkedCategoriesThree.some(
        (b) => b.id === categoryThree.id
      );
      if (isCategoryThreeChecked) {
        state.checkedCategoriesThree = state.checkedCategoriesThree.filter(
          (b) => b.id !== categoryThree.id
        );
      } else {
        state.checkedCategoriesThree.push(categoryThree);
      }
    },
    toggleCategoryFour: (state, action) => {
      const categoryFour = action.payload;
      const isCategoryFourChecked = state.checkedCategoriesFour.some(
        (b) => b.id === categoryFour.id
      );
      if (isCategoryFourChecked) {
        state.checkedCategoriesFour = state.checkedCategoriesFour.filter(
          (b) => b.id !== categoryFour.id
        );
      } else {
        state.checkedCategoriesFour.push(categoryFour);
      }
    },
    toggleCategoryFive: (state, action) => {
      const categoryFive = action.payload;
      const isCategoryFiveChecked = state.checkedCategoriesFive.some(
        (b) => b.id === categoryFive.id
      );
      if (isCategoryFiveChecked) {
        state.checkedCategoriesFive = state.checkedCategoriesFive.filter(
          (b) => b.id !== categoryFive.id
        );
      } else {
        state.checkedCategoriesFive.push(categoryFive);
      }
    },
    resetPos: (state) => {
      state.posProducts = [];
      state.lastModifiedProduct = null;
      state.lastModifiedProducts = [];
      toast.info("POS has been reset");
    },
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    triggerRefresh: (state) => {
      state.refreshProducts = !state.refreshProducts; // Toggle state to force update
    },
  },
});

// Export actions
export const {
  SET_ACTIVE_USER,
  REMOVE_ACTIVE_USER,
  addToPos,
  resetPos,
  increasePosQuantity,
  decreasePosQuantity,
  deleteItemPos,
  toggleBrand,
  toggleCategory,
  toggleCategoryTwo,
  toggleCategoryThree,
  toggleCategoryFour,
  toggleCategoryFive,
  updateDiscount,
  updateQuantity,
  setSelectedCustomer,
  clearSelectedCustomer,
  triggerRefresh,
  setExistingLocation,
} = IchthusSlice.actions;

// Export selectors
export const selectIsLoggedIn = (state) => state.orebiReducer.isLoggedIn;

export const selectEmail = (state) => state.orebiReducer.email;
export const selectFullName = (state) => state.orebiReducer.fullName;
export const selectImgUrl = (state) => state.orebiReducer.imgUrl;
export const selectAdmin = (state) => state.orebiReducer.admin;
export const selectRoleName = (state) => state.orebiReducer.roleName;
export const selectRoleId = (state) => state.orebiReducer.roleId;

export const selectUserID = (state) => state.orebiReducer.userID;
export const selectPosProducts = (state) => state.orebiReducer.posProducts;
export const selectLastModifiedProduct = (state) =>
  state.orebiReducer.lastModifiedProduct;
export const selectLastModifiedProducts = (state) =>
  state.orebiReducer.lastModifiedProducts;
export const selectSelectedCustomer = (state) =>
  state.orebiReducer.selectedCustomer;
export default IchthusSlice.reducer;
