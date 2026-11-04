"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Pencil, Settings, Trash2, X, Loader } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useAuthToken } from "@/lib/useAuthToken";
export default function InventoryManagement() {
  const previousSectionRef = useRef("inventory");
  // const previousTokenRef = useRef(null);
  // const [inventory, setInventory] = useState([])
  const [allInventory, setAllInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [cats, setCats] = useState([]);
  // const [allCats, setAllCats] = useState([])
  const [isMenuItem, setIsMenuItem] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);
  const token = useAuthToken();
  const [fs, setFS] = useState({
    all: 0,
    ls: 0,
    oos: 0,
    ate: 0,
    ex: 0,
    os: 0,
  });
  const [fSC, setFSC] = useState({
    all: 0,
    new: 0,
    fair: 0,
    broken: 0,
    retired: 0,
  });
  // const [metricsData, setMetricsData] = useState({
  //   all: 0,
  //   lowStock:0,
  //   outOfStock:0,
  //   aboutToExpire:0,
  //   expired:0
  // });
  const { showAlert } = useAlert();
  const [cursor, setCursor] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  // const [deletedImages, setDeletedImages] = useState([]);

  // Section tabs: 'inventory' | 'crockery' | 'housekeeping'
  const [activeSection, setActiveSection] = useState("inventory");

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Lists for other sections
  // const [crockeries, setCrockeries] = useState([]);
  // const [chemicals, setChemicals] = useState([]);

  // Crockery form state
  // const [crockeryForm, setCrockeryForm] = useState({
  //   itemName: "",
  //   category: "",
  //   sku: "",
  //   department: "",
  //   uom: "",
  //   quantityOnHand: 0,
  //   reorderLevel: 0,
  //   purchasePrice: 0,
  //   vendor: "",
  //   purchaseDate: "",
  //   assetTag: "",
  //   condition: "",
  //   location: "",
  //   depreciationApplicable: false,
  //   replacementPolicy: "",
  // });

  // // Chemical form state
  // const [chemicalForm, setChemicalForm] = useState({
  //   itemName: "",
  //   sku: "",
  //   department: "",
  //   uom: "",
  //   quantityOnHand: 0,
  //   reorderLevel: 0,
  //   purchasePrice: 0,
  //   vendor: "",
  //   purchaseDate: "",
  //   batchNumber: "",
  //   expiryDate: "",
  //   storageLocation: "",
  //   sdsUrl: "",
  //   hazardClassification: "",
  // });

  const [formData, setFormData] = useState({
    // Common
    name: "",
    category: "",
    catIcon: "",
    unit: "", // UoM
    currentStock: 0, // Quantity on hand
    minStock: 0, // "Reorder Level (Par Stock)"
    maxStock: 0,
    costPrice: 0,
    supplier: "", // endor
    location: "",
    expiryDate: "",
    batchNumber: "",
    sku: "",

    // Crockery-specific
    department: "",
    purchaseDate: "",
    assetTag: "",
    condition: "",
    replacementPolicy: "",

    // Chemical-specific
    hazardClassification: "",
    sdsUrl: "",
  });

  const [menuFormData, setMenuFormData] = useState({
    name: formData.name || "",
    // nameEn: '',
    description: "",
    // descriptionEn:'',
    tax: "",
    hsnCode: "",
    skuCode: "",
    shortDescription: "",
    itemType: "retail",
    price: 0,
    category: "",
    available: true,
    allergens: [],
    preparationTime: 0,
    image: "",
    extraImages: [],
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    spicy: false,
    spicyLevel: 0,
    featured: false,
    ingredients: [],
    nutritionalInfo: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    },
    servingSize: "",
    cookingMethod: "",
    origin: "",
    chefSpecial: false,
    seasonal: false,
    tags: [],
    portionSizes: [{ name: "Regular", price: 0, description: "" }],
  });

  const previousFilters = useRef({
    activeSection: "inventory",
    filter: "all",
    selectedCategory: "all",
  });
  const dietaryOptions = [
    { key: "available", label: "Available", color: "green" },
    { key: "vegetarian", label: "Vegetarian", color: "green" },
    { key: "vegan", label: "Vegan", color: "green" },
    { key: "glutenFree", label: "Gluten Free", color: "blue" },
    { key: "spicy", label: "Spicy", color: "red" },
    { key: "featured", label: "Featured Item", color: "purple" },
    { key: "chefSpecial", label: "Chef's Special", color: "yellow" },
    { key: "seasonal", label: "Seasonal Item", color: "orange" },
  ];

  const handleToggle = (key) => {
    setMenuFormData({ ...menuFormData, [key]: !menuFormData[key] });
  };

  const handleTagToggle = (tag) => {
    if (menuFormData.tags.includes(tag)) {
      setMenuFormData({
        ...menuFormData,
        tags: menuFormData.tags.filter((t) => t !== tag),
      });
    } else {
      setMenuFormData({
        ...menuFormData,
        tags: [...menuFormData.tags, tag],
      });
    }
  };

  const handleAllergenToggle = (allergen) => {
    if (menuFormData.allergens.includes(allergen)) {
      setMenuFormData({
        ...menuFormData,
        allergens: menuFormData.allergens.filter((a) => a !== allergen),
      });
    } else {
      setMenuFormData({
        ...menuFormData,
        allergens: [...menuFormData.allergens, allergen],
      });
    }
  };

  const getColorClasses = (color, isSelected) => {
    const colorMap = {
      green: isSelected
        ? "bg-green-300 text-green-800 border-green-600"
        : "bg-white text-gray-500 border-green-300 hover:bg-green-50",
      blue: isSelected
        ? "bg-blue-300 text-green-800 border-blue-600"
        : "bg-white text-gray-500 border-blue-300 hover:bg-blue-50",
      red: isSelected
        ? "bg-red-300 text-red-800 border-red-600"
        : "bg-white text-gray-500 border-red-300 hover:bg-red-50",
      purple: isSelected
        ? "bg-purple-300 text-purple-800 border-purple-600"
        : "bg-white text-gray-500 border-purple-300 hover:bg-purple-50",
      yellow: isSelected
        ? "bg-yellow-300 text-yellow-800 border-yellow-600"
        : "bg-white text-gray-500 border-yellow-300 hover:bg-yellow-50",
      orange: isSelected
        ? "bg-orange-300 text-orange-800 border-orange-600"
        : "bg-white text-gray-500 border-orange-300 hover:bg-orange-50",
    };
    return colorMap[color] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const selectedItems = dietaryOptions.filter(
    (option) => menuFormData[option.key]
  );

  const [customIngredient, setCustomIngredient] = useState("");

  // Common ingredients
  const commonIngredients = [
    "Chicken",
    "Beef",
    "Pork",
    "Fish",
    "Shrimp",
    "Tofu",
    "Eggs",
    "Rice",
    "Noodles",
    "Pasta",
    "Bread",
    "Flour",
    "Milk",
    "Cheese",
    "Tomatoes",
    "Onions",
    "Garlic",
    "Ginger",
    "Soy Sauce",
    "Salt",
    "Pepper",
    "Oil",
    "Butter",
    "Cream",
    "Herbs",
    "Spices",
  ];

  // Separate common ingredients from custom ones
  const commonSelected = menuFormData.ingredients.filter((ing) =>
    commonIngredients.includes(ing)
  );
  const customSelected = menuFormData.ingredients.filter(
    (ing) => !commonIngredients.includes(ing)
  );

  const handleIngredientToggle = (ingredient) => {
    if (menuFormData.ingredients.includes(ingredient)) {
      setMenuFormData({
        ...menuFormData,
        ingredients: menuFormData.ingredients.filter((i) => i !== ingredient),
      });
    } else {
      setMenuFormData({
        ...menuFormData,
        ingredients: [...menuFormData.ingredients, ingredient],
      });
    }
  };

  const handleAddCustomIngredient = () => {
    const trimmedIngredient = customIngredient.trim();
    if (
      trimmedIngredient &&
      !menuFormData.ingredients.includes(trimmedIngredient)
    ) {
      setMenuFormData({
        ...menuFormData,
        ingredients: [...menuFormData.ingredients, trimmedIngredient],
      });
      setCustomIngredient("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomIngredient();
    }
  };

  // const selectedItems = dietaryOptions.filter(option => formData[option.key]);
  // Menu Items State and functions
  // Predefined allergens
  const commonAllergens = [
    "Gluten",
    "Dairy",
    "Eggs",
    "Fish",
    "Shellfish",
    "Tree Nuts",
    "Peanuts",
    "Soy",
    "Sesame",
    "Mustard",
    "Celery",
    "Lupin",
  ];

  const cookingMethods = [
    "Grilled",
    "Fried",
    "Steamed",
    "Boiled",
    "Baked",
    "Roasted",
    "Sautéed",
    "Stir-fried",
    "Deep-fried",
    "Pan-fried",
    "Braised",
    "Poached",
    "Smoked",
    "Raw",
    "Fermented",
  ];

  // Common tags
  const commonTags = [
    "Popular",
    "New",
    "Healthy",
    "Low Calorie",
    "High Protein",
    "Comfort Food",
    "Traditional",
    "Fusion",
    "Spicy",
    "Mild",
    "Sweet",
    "Savory",
    "Crispy",
    "Tender",
    "Fresh",
  ];

  const [imagePreview, setImagePreview] = useState(null);
  const [extraImages, setExtraImages] = useState([]);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [menuCategories, setMenuCategories] = useState([]);

  // const
  //  const [customIngredient, setCustomIngredient] = useState('');

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create a local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result;
      // setMenuFormData(prev => ({ ...prev, image: imageUrl }))
      setMenuFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleExtraImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Restrict to max 5
    if (files.length + (menuFormData.extraImages?.length || 0) > 5) {
      // alert("You can upload up to 5 extra images only.")
      showAlert(
        "error",
        "Upload Error",
        "You can upload up to 5 extra images only.",
        [{ text: "Okay" }]
      );
      return;
    }

    const previews = [];
    const fileObjs = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          previews.push(reader.result.toString());
          fileObjs.push(file);

          // When all files are processed
          if (previews.length === files.length) {
            setExtraImages((prev) => [...prev, ...previews]); // UI preview
            setMenuFormData((prev) => ({
              ...prev,
              extraImages: [...(prev.extraImages || []), ...fileObjs], // store File objects
            }));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMenuSubmit = async (e) => {
    // e.preventDefault()

    // setSubmitLoading(true)

    let imageUrl = "";
    let extraImageUrls = [];

    // 1️⃣ Upload main image if it's a new File
    if (menuFormData.image instanceof File) {
      const formDataToSend = new FormData();
      formDataToSend.append("file", menuFormData.image);

      const res = await fetch("/api/uploadMenuFile", {
        method: "POST",
        body: formDataToSend,
      });
      const data = await res.json();

      if (data.success) {
        imageUrl = data.url;
      } else {
        // alert("Main image upload failed")
        showAlert("error", "Upload Error", "Main image upload failed", [
          { text: "Okay" },
        ]);

        return;
      }
    }

    // 2️⃣ Upload extra images if they are new Files
    if (
      Array.isArray(menuFormData.extraImages) &&
      menuFormData.extraImages.length > 0
    ) {
      for (const file of menuFormData.extraImages) {
        if (file instanceof File) {
          const fd = new FormData();
          fd.append("file", file);

          const res = await fetch("/api/uploadMenuFile", {
            method: "POST",
            body: fd,
          });
          const data = await res.json();
          if (data.success) {
            extraImageUrls.push(data.url);
          }
        }
      }
    }

    // 3️⃣ Final values (preserve old if not replaced, append new)
    const finalImageUrl =
      imageUrl ||
      (typeof menuFormData.image === "string" ? menuFormData.image : "");

    const finalExtraImages = [
      ...(Array.isArray(menuFormData.extraImages)
        ? menuFormData.extraImages.filter((img) => typeof img === "string") // keep old URLs only
        : []),
      ...extraImageUrls, // newly uploaded ones
    ];

    if (!token) return;
    try {
      const url = "/api/menu";
      const method = "POST";

      // console.log(`From data menu: ${JSON.stringify(menuFormData)}`)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // body: JSON.stringify(menuFormData),
        body: JSON.stringify({
          ...menuFormData,
          image: finalImageUrl, // send the S3 URL instead of the File object
          extraImages: finalExtraImages,
          deletedImages: [],
        }),
      });

      // if (response.ok) {
      //   // fetchMenuItems()
      //   // console.log(`Response is Okay for Menu Items`)
      //   // setShowAddForm(false)
      //   // setEditingItem(null)
      //   setExtraImages([]);

      //   setMenuFormData({
      //     // name: { en: "", ja: "" },
      //     name: "",
      //     nameEn: "",
      //     // description: { en: "", ja: "" },
      //     description: "",
      //     descriptionEn: "",
      //     shortDescription: "",
      //     tax: "",
      //     itemType: "retail",
      //     price: "",
      //     category: "",
      //     available: true,
      //     allergens: [],
      //     preparationTime: 0,
      //     image: "",
      //     extraImages: [],
      //     vegetarian: false,
      //     vegan: false,
      //     glutenFree: false,
      //     spicy: false,
      //     spicyLevel: 0,
      //     featured: false,
      //     ingredients: [],
      //     nutritionalInfo: {
      //       calories: 0,
      //       protein: 0,
      //       carbs: 0,
      //       fat: 0,
      //       fiber: 0,
      //       sugar: 0,
      //       sodium: 0,
      //     },
      //     servingSize: "",
      //     cookingMethod: "",
      //     origin: "",
      //     chefSpecial: false,
      //     seasonal: false,
      //     tags: [],
      //     portionSizes: [{ name: "Regular", price: 0, description: "" }],
      //   });
      // }

      if (response.ok) {
  const savedItem = await response.json();

  // Update the list optimistically
  setAllInventory(prev => {
    if (editingItem) {
      // Update mode: replace the old item
      return prev.map(item => 
        item._id === savedItem._id ? savedItem : item
      );
    } else {
      // Add mode: append new item (avoid duplicates)
      if (prev.some(i => i._id === savedItem._id)) return prev;
      return [...prev, savedItem];
    }
  });

  // Close form
  setShowAddForm(false);
  setEditingItem(null);
  setIsMenuItem(false);
  resetForm();

  // Show correct message
  const message = editingItem 
    ? "Item updated successfully!" 
    : "Item added successfully!";

  showAlert("success", "Success!", message);

  // Optional: refetch to ensure sync (recommended for safety)
  fetchInventory(false, activeSection, filter, selectedCategory, "");
}
    } catch (error) {
      console.error("Error saving menu item:", error);
    }

    // setSubmitLoading(false)
  };

  useEffect(() => {
    if (!token) return;
    fetchMenuCategories();
    setLoading(true);
  }, [token]);

  const fetchMenuCategories = async () => {
    // setLoading(true  )
    if (!token) return;
    try {
      const response = await fetch("/api/categories/manage", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      // console.log(`Categories: ${JSON.stringify(data)}`)
      setMenuCategories(data);
      // console.log("Inventory categories not display:",data)
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      // setLoading(false) // stop loading
    }
  };

  // const getStockStatus = (item) => {
  //   if (new Date(item.expiryDate) <= new Date()) return "expired";

  //   const expiryDate = new Date(item.expiryDate); // "2025-08-01"
  //   const today = new Date();

  //   // Add 7 days to today
  //   const sevenDaysFromNow = new Date();
  //   sevenDaysFromNow.setDate(today.getDate() + 7);

  //   if (expiryDate <= sevenDaysFromNow) return "expiring";

  //   if (item.currentStock == 0) return "out";
  //   if (item.currentStock <= item.minStock) return "low";
  //   if (item.currentStock >= item.maxStock) return "high";
  //   return "normal";
  // };

const getStockStatus = (item) => {
  if (!item.expiryDate) {
    if (item.currentStock === 0) return "out";
    if (item.currentStock <= item.minStock) return "low";
    if (item.currentStock > item.maxStock) return "high";
    return "normal";
  }

  const expiry = new Date(item.expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thresholdDate = new Date(today);
  thresholdDate.setDate(today.getDate() + 7);

  if (expiry < today) return "expired";
  if (expiry <= thresholdDate) return "expiring";
  if (item.currentStock === 0) return "out";
  if (item.currentStock <= item.minStock) return "low";
  if (item.currentStock > item.maxStock) return "high";
  return "normal";
};

  const getBadgeProps = (item) => {
    // if (activeSection !== "crockery") {
    //   switch (getStockStatus(item)) {
    //     case "expired":
    //       return { text: "Expired", color: "bg-red-100 text-red-800" };
    //     case "expiring":
    //       return { text: "About to Expire", color: "bg-red-100 text-red-800" };
    //     case "out":
    //       return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    //     case "low":
    //       return { text: "Low Stock", color: "bg-red-100 text-red-800" };
    //     case "high":
    //       return {
    //         text: "Overstocked",
    //         color: "bg-yellow-100 text-yellow-800",
    //       };
    //     default:
    //       return { text: "Normal", color: "bg-green-100 text-green-800" };
    //   }
    // }
 if (activeSection !== "crockery") {
    // Same priority as backend
    if (item.expiryDate) {
      const expiry = new Date(item.expiryDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      const threshold = new Date(today);
      threshold.setDate(today.getDate() + 7);

      if (expiry < today) return { text: "Expired", color: "bg-red-100 text-red-800" };
      if (expiry <= threshold) return { text: "About to Expire", color: "bg-orange-100 text-orange-800" };
    }

    if (item.currentStock === 0) return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (item.currentStock <= item.minStock && item.currentStock > 0) return { text: "Low Stock", color: "bg-red-100 text-red-800" };
    if (item.currentStock > item.maxStock) return { text: "Overstocked", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Normal", color: "bg-green-100 text-green-800" };
  }
     else {
      switch (item.condition?.toLowerCase()) {
        case "broken":
          return { text: "Broken", color: "bg-red-100 text-red-800" };
        case "new":
          return { text: "New", color: "bg-yellow-100 text-yellow-800" };
        case "fair":
          return { text: "Fair", color: "bg-blue-100 text-blue-800" };
        case "retired":
          return { text: "Retired", color: "bg-gray-100 text-gray-800" };
        case "good":
        default:
          return { text: "Good", color: "bg-green-100 text-green-800" };
      }
    }
  };

  // useEffect(() => {
  //   const filteredInv = allInventory.filter(inv => inv.type === activeSection);
  //   setInventory(filteredInv);

  //   let uniqueCategories = [];
  // const seen = new Set();

  //   filteredInv.forEach((item) => {
  //   if (!seen.has(item.category)) {
  //     seen.add(item.category)
  //     uniqueCategories.push({
  //       name: item.category,
  //       icon: item.catIcon,
  //     })
  //   }
  // })

  // // // setFilter('all')
  // // setSelectedCategory('all')

  // console.log('uniqueCategories', uniqueCategories);

  // setCategories(uniqueCategories) // set once

  // }, [activeSection, allInventory])

  useEffect(() => {
    if (!token) return;
    fetchSuppliers();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    // Only reset on section change (rare), not on category/filter
    if (activeSection !== previousSectionRef.current) {
      setAllInventory([]);
      setCursor("");
      setLoading(true);
      previousSectionRef.current = activeSection;
    }

    fetchInventory(false, activeSection, filter, selectedCategory, "");
  }, [activeSection, filter, selectedCategory, token]);


  // useEffect(() => {
  //   if (!token) return;

  //   const prev = previousFilters.current;
  //   const shouldReset =
  //     activeSection !== prev.activeSection ||
  //     filter !== prev.filter ||
  //     selectedCategory !== prev.selectedCategory;

  //   if (shouldReset) {
  //     setAllInventory([]);
  //     setCursor("");
  //     setLoading(true);
  //   }

  //   previousFilters.current = { activeSection, filter, selectedCategory };

  //   fetchInventory(false, activeSection, filter, selectedCategory, "");
  // }, [token, activeSection, filter, selectedCategory]);

  const fetchInventory = async (
    append = false,
    activeSection = "inventory",
    filter = "all",
    selectedCategory = "all",
    cursors = ""
  ) => {
    if (!token) return;
    // setLoading(true)
    // console.log((`Fetching inventory with params: Active Section: ${activeSection}, Filter: ${filter}, Selected Category: ${selectedCategory}, Cursors: ${cursors}`));
    if (!append) setLoading(true); // Only show loader on fresh loads
    // else setLoadin g(true); // Optional: show mini loader

    // console.log(`Fetching: append=${append}, cursor=${cursors}`);
    try {
      const response = await fetch(
        `/api/inventory?type=${activeSection}&filter=${encodeURIComponent(
          filter
        )}&category=${encodeURIComponent(selectedCategory)}&cursor=${cursors}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      // setInventory(data)

      // console.log((`The fetched data: ${JSON.stringify(data.items,["_id", "name", 'category', 'type'],2)}`));

      const combinedData = append
        ? [...allInventory, ...data.items]
        : [...data.items];

      const newItems = data.items || [];
     
      setAllInventory((prev) => {
        if (!append) {
          return newItems; // Fresh load → replace current page
        }

        // Append: only add items not already in state
        const existingIds = new Set(prev.map((i) => i._id));
        const filteredNew = newItems.filter(
          (item) => !existingIds.has(item._id)
        );

        return [...prev, ...filteredNew]; // Old + new = all items
      });
      // console.log(`Next cursor: ${JSON.stringify(data.nextCursor)}`);
      // setHasMore(!!data.nextCursor)
      setCursor(data.nextCursor || "");
      setHasMore(data.items.length === 20);

      if (activeSection !== "crockery") {
        setFS({
          all: data.totalCount,
          ls: data.counts.low,
          oos: data.counts.out,
          ate: data.counts.expiring,
          ex: data.counts.expired,
          os: data.counts.overstocked,
        });
      } else {
        setFSC({
          all: data.totalCount,
          new: data.counts.new,
          fair: data.counts.fair,
          retired: data.counts.retired,
          broken: data.counts.broken,
        });
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const observerRef = useRef(null);
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;
    // Cleanup old observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // console.log(`Intersection Observer Entry:  ${entries[0].isIntersecting} hasMore: ${hasMore} Loading: ${!loading}`);
        if (entries[0].isIntersecting && hasMore && !loading) {
          // console.log(`Fetching with: ${activeSection}, Filter: ${filter}, Selected Category: ${selectedCategory}, Cursors: ${cursor}`)
          fetchInventory(true, activeSection, filter, selectedCategory, cursor);
        }
      },
      { threshold: 0.1, root: null }
    );

    if (loader) observer.observe(loader);

    return () => {
      if (loader) observer.unobserve(loader);
    };
  }, [hasMore, cursor, loading, activeSection, filter, selectedCategory]);

  useEffect(() => {
    if (loading) return;
    const filt = "all";
    const cate = "all";
    setFilter(filt);
    setSelectedCategory(cate);
    const curs = "";
    setCursor(curs);

    fetchInventory(false, activeSection, filt, cate, curs);
  }, [activeSection]);

  useEffect(() => {
    if (loading) return;

    const cur = "";
    setCursor(cur);

    // console.log(`Active Section: ${activeSection}, Filter: ${filter}, Selected Category: ${selectedCategory}, Cursor: ${cur}`);
    fetchInventory(false, activeSection, filter, selectedCategory, cur);
  }, [filter, selectedCategory]);

  const fetchSuppliers = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/categories/supplier", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // const response = await fetch("/api/suppliers")
      const data = await response.json();
      // console.log(`Fetched suppliers: ${JSON.stringify(data,null,2)}`)
      // const filteredSuppliers = data.map(supplier => supplier.name);
      // console.log(`Fetched suppliers filtered: ${JSON.stringify(filteredSuppliers,null,2)}`);
      // setSuppliers(data)
      setAllSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  // useEffect(() => {
  //   const filteredCats = allCats.filter(cat => cat.type === activeSection);
  //   setCats(filteredCats)
  // }, [allCats])

  const fetchInventoryCategories = async () => {
    if (!token) return;
    setLoadingCategories(true);
    try {
      const response = await fetch(
        `/api/categories/inventory?type=${activeSection}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      const data = await response.json();
      setCategories(data || []);
      setCats(data || []);
    } catch (error) {
      console.error("Error fetching inventory categories:", error);
      setCategories([]);
      setCats([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchInventoryCategoriesToSelect = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/categories/inventory_unique", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      // console.log(`Fetched Unique inventory categories: ${JSON.stringify(data,null,2)}`)
      // setCats(data)
    } catch (error) {
      console.error("Error fetching inventory categories:", error);
    }
  };

  useEffect(() => {
    if (token) {
      // setLoadingCategories(true);
      fetchInventoryCategories();
    }
  }, [activeSection, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) return;

    setSubmitLoading(true);
    if (isMenuItem) {
      await handleMenuSubmit();
    }
    try {
      const url = editingItem
        ? `/api/inventory/${editingItem._id}`
        : "/api/inventory";
      const method = editingItem ? "PUT" : "POST";

      // console.log(` url and method : ${url}, ${method}`)

      const derivedType =
        activeSection === "inventory"
          ? "inventory"
          : activeSection === "crockery"
          ? "crockery"
          : "housekeeping";
      // console.log("url -> ",url);
      // SKU uniqueness check for menu items
      if (menuFormData.skuCode) {
        const skuUsed = isSkuAlreadyUsed(menuFormData.skuCode);
        if (skuUsed) {
          showAlert(
            "error",
            "Duplicate SKU",
            "This SKU Code is already used in inventory. Menu items must have unique SKUs.",
            [{ text: "OK" }]
          );
          return;
        }
      }
      // Prepare payload
    const payload = {
      ...formData,
      type: editingItem?.type || derivedType,
    };

    // Critical fix: Ensure expiryDate is a proper ISO string if present
    if (payload.expiryDate) {
      // Convert "2026-03-31" → "2026-03-31T00:00:00.000Z"
      payload.expiryDate = new Date(payload.expiryDate + "T00:00:00Z").toISOString();
    }

    // For update: do NOT send _id in body (it's in URL)
    if (editingItem) {
      delete payload._id;  // ← Very important!
    }
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          type: editingItem?.type || derivedType,
        }),
      });
      // console.log("response is -> ",response);

      // console.log(` The updating response : ${response.ok}`);

      // if (response.ok) {
      //   // fetchInventory(false, activeSection); // pass the current active section
      //   fetchInventory(false, activeSection, filter, selectedCategory, cursor); // Use current filter and category
      //   setShowAddForm(false);
      //   setEditingItem(null);
      //   setIsMenuItem(false);
      //   resetForm();
      //   // console.log(`Response is Okay for Inventory Items`)
      // }
      if (response.ok) {
  const newItem = await response.json();  // Get the newly created item

  // THIS IS THE MAGIC LINE — ADD NEW ITEM TO END WITHOUT REFETCHING
  // setAllInventory(prev => [...prev, newItem]);
  setAllInventory(prev => {
    // Prevent duplicate if already exists
    if (prev.some(i => i._id === newItem._id)) return prev;
    return [...prev, newItem];
  })
  // Close form
  setShowAddForm(false);
  setEditingItem(null);
  setIsMenuItem(false);
  resetForm();

  showAlert("success", "Success!", "Item added successfully.");
  // Show loading + refetch fresh data
  // setLoading(true);
  fetchInventory(false, activeSection, filter, selectedCategory, "");
}
    } catch (error) {
      console.error("Error saving inventory item:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      // Common
      name: "",
      category: "",
      catIcon: "",
      unit: "", // UoM
      currentStock: 0, // Quantity on hand
      minStock: 0, // "Reorder Level (Par Stock)"
      costPrice: 0,
      supplier: "", // endor
      location: "",
      expiryDate: "",
      batchNumber: "",
      sku: "",
      maxStock: 0,

      // Crockery-specific
      department: "",
      purchaseDate: "",
      assetTag: "",
      condition: "",
      replacementPolicy: "",
      brand: "",
      material: "",
      size: "",
      condition: "",

      // Chemical-specific
      hazardClassification: "",
      sdsUrl: "",
    });
  };

  const handleEdit = (item) => {
    setIsMenuItem(false);
    setEditingItem(item);
    setFormData(item);
    const filteredCats = categories.filter((cat) => cat.type === activeSection);
    setCats(filteredCats);

    const filteredSups = allSuppliers.filter(
      (sup) => sup.type === activeSection
    );
    setSuppliers(filteredSups);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!token) return;
    setSubmitLoading(true);
    // if (confirm("Are you sure you want to delete this item?")) {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      // if (response.ok) {
      //   fetchInventory();
      // }
      if (response.ok) {

            // 2. Reset pagination + refetch fresh data with current filters
            setCursor("");
            setHasMore(true);

            await fetchInventory(
              false,               // fresh load
              activeSection,
              filter,
              selectedCategory,
              ""                   // cursor = ""
            );

            showAlert("success", "Deleted!", "Item removed successfully.");
      } else {
       showAlert("error", "Failed", "Could not delete the item.");
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error);
    } finally {
      setSubmitLoading(false);
    }
    // }
  };

  // const updateStock = async (id, newStock, type) => {
  //   try {
  //     const response = await fetch(`/api/inventory/${id}/stock`, {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ stock: newStock, type }),
  //     })
  //     if (response.ok) {
  //     fetchInventory(false, activeSection, filter, selectedCategory, cursor)
  //     }
  //   } catch (error) {
  //     console.error("Error updating stock:", error)
  //   }
  // }
// --------------------------------------Last Used Code----------------------------------
  // Change this value to adjust the "About to expire" window
  // const updateStock = async (id, newStock, type) => {
  //   if (!token) return;
  //   try {
  //     const response = await fetch(`/api/inventory/${id}/stock`, {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ stock: Number.parseFloat(newStock), type }),
  //     });

  //     if (response.ok) {       
  //       await fetchInventory(false, activeSection, filter, selectedCategory, cursor);
  //     } else {
  //       const data = await response.json();
  //       console.error("Error updating stock:", data.error);
  //       fetchInventory(false, activeSection, filter, selectedCategory, cursor); // Re-fetch to restore original data
  //     }
      
  //   } catch (error) {
  //     console.error("Error updating stock:", error);
  //     // Revert optimistic update on error
  //     fetchInventory(false, activeSection, filter, selectedCategory, cursor);
  //   }
  // };

const updateStock = async (id, newStock, type) => {
  if (!token) return;

  // Optimistic UI update — instantly show the new stock
  setAllInventory(prev =>
    prev.map(item =>
      item._id === id
        ? { ...item, currentStock: Number.parseFloat(newStock) }
        : item
    )
  );

  try {
    const response = await fetch(`/api/inventory/${id}/stock`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stock: Number.parseFloat(newStock), type }),
    });

    if (!response.ok) {
      showAlert("error", "Failed", "Could not update stock");
      // Optional: revert on error
      // fetchInventory(false, activeSection, filter, selectedCategory, cursor);
    }
    // No need to refetch — optimistic update is enough!
    // If you want 100% sync, do silent background fetch:
    // fetchInventory(false, activeSection, filter, selectedCategory, cursor);
  } catch (error) {
    console.error("Error updating stock:", error);
    showAlert("error", "Error", "Network error");
    // Revert on network failure
    // fetchInventory(false, activeSection, filter, selectedCategory, cursor);
  }
};

  const EXPIRY_WARNING_DAYS = 7;

  // Returns true if item expires within the next EXPIRY_WARNING_DAYS (inclusive), and not already expired
  const isAboutToExpire = (item) => {
    if (!item?.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    if (isNaN(expiry)) return false;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const threshold = new Date(startOfToday);
    threshold.setDate(threshold.getDate() + EXPIRY_WARNING_DAYS);

    return expiry >= startOfToday && expiry <= threshold;
  };

  // Returns true if item has already expired (before today)
  const isExpired = (item) => {
    if (!item?.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    if (isNaN(expiry)) return false;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return expiry < startOfToday;
  };

  // Inventory filtered only by selected category (used for static counts)
  const categoryFiltered = allInventory;
  // const categoryFiltered = allInventory.filter((item) => {
  //   if (selectedCategory && selectedCategory !== "all") {
  //     return item.category === selectedCategory;
  //   }
  //   return true;
  // });

  // Inventory filtered by both category and active filter (used for list rendering)
  // NEW — CORRECT (API already did the job)
const filteredInventory = allInventory;

  // const filteredInventory = allInventory.filter((item) => {
  //   if (selectedCategory && selectedCategory !== "all") {
  //     if (item.category !== selectedCategory) return false;
  //   }

  //   if (filter === "all") return true;
  //   if (filter === "low") return item.currentStock <= item.minStock;
  //   if (filter === "out") return item.currentStock === 0;
  //   if (filter === "expiring") return isAboutToExpire(item);
  //   if (filter === "expired") return isExpired(item);
  //   return true;
  // });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-3">
            {/* Left: back + title */}
            <div className="flex items-center">
              <Link
                href="/"
                className="text-orange-500 hover:text-orange-800 mr-4 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-md font-semibold text-gray-900">
                  Inventory Management
                </h1>
              </div>
            </div>

            {/* Middle: tabs */}
            <div className="flex-1 flex justify-center gap-2">
              <button
                onClick={() => setActiveSection("inventory")}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  activeSection === "inventory"
                    ? "bg-orange-500 text-white shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => setActiveSection("crockery")}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  activeSection === "crockery"
                    ? "bg-orange-500 text-white shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Crockeries
              </button>
              <button
                onClick={() => setActiveSection("housekeeping")}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  activeSection === "housekeeping"
                    ? "bg-orange-500 text-white shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Housekeeping
              </button>
            </div>

            {/* Right: dynamic add button */}
            <div className="ml-auto">
              <button
                onClick={() => {
                  const filteredCats = categories.filter(
                    (cat) => cat.type === activeSection
                  );
                  setCats(filteredCats);
                  const filteredSups = allSuppliers.filter(
                    (sup) => sup.type === activeSection
                  );
                  setSuppliers(filteredSups);
                  setShowAddForm(true);
                }}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-4 py-2 rounded hover:from-orange-600 hover:to-orange-600 font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                {activeSection === "inventory"
                  ? "Add new Inventory item"
                  : activeSection === "crockery"
                  ? "Add new Crockery item"
                  : activeSection === "housekeeping"
                  ? "Add new housekeeping item"
                  : ""}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Vertical panel to filter items according to categories */}
        <div className="h-screen pb-10 w-30 bg-white border-r border-gray-200 flex flex-col overflow-x-hidden overflow-y-auto scrollbar-hide">
          {loadingCategories ? (
            <div className="flex flex-col items-center justify-center min-w-48 py-6 space-y-2">
              {/* <Loader2 className="w-6 h-6 text-orange-500 animate-spin" /> */}
              <span className="text-sm text-gray-500">
                Loading categories...
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex flex-col items-center py-4 px-4 border-b border-gray-100 hover:bg-gray-50 ${
                  selectedCategory === "all"
                    ? "bg-orange-50 border-l-4 border-l-orange-500"
                    : ""
                }`}
              >
                <div className="text-2xl mb-2">🍽️</div>
                <span className="text-sm text-gray-700 text-center">All</span>
              </button>
              {categories.map((category, index) => (
                <button
                  // key={category._id + index}
                  key={index}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex flex-col items-center py-4 px-3 border-b border-gray-100 hover:bg-gray-50 ${
                    selectedCategory === category.name
                      ? "bg-orange-50 border-l-4 border-l-orange-500"
                      : ""
                  }`}
                >
                  <div className="text-2xl mb-2">{category.icon || "🍴"}</div>
                  <span className="text-xs text-gray-700 text-center">
                    {category.name}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="h-screen w-full px-4 sm:px-3 lg:px-5 py-3 bg-gray-50 overflow-x-hidden overflow-y-auto custom-scrollbar">
          {/* Filter Buttons */}
          <div className="bg-white rounded shadow-sm px-5 py-4 mb-3">
            {activeSection !== "crockery" ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilter("all")}
                  className={`h-10 px-4 py-0 rounded font-semibold transition-all text-xs leading-none ${
                    filter === "all"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Items ({fs.all})
                </button>

                <button
                  onClick={() => setFilter("low")}
                  className={`h-10 px-4 py-0 rounded font-semibold transition-all text-xs leading-none ${
                    filter === "low"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Low Stock ({fs.ls})
                </button>
                  
                <button
                  onClick={() => setFilter("out")}
                  className={`h-10 px-4 py-0 rounded font-semibold transition-all text-xs leading-none ${
                    filter === "out"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Out of Stock ({fs.oos})
                </button>

                <button
                  onClick={() => setFilter("expiring")}
                  className={`h-10 px-4 py-0 rounded font-semibold transition-all text-xs leading-none ${
                    filter === "expiring"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  About to expire ({fs.ate})
                </button>

                <button
                  onClick={() => setFilter("expired")}
                  className={`h-10 px-4 py-0 rounded font-semibold transition-all text-xs leading-none ${
                    filter === "expired"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Expired ({fs.ex})
                </button>
                <button
                  onClick={() => setFilter("overstocked")}
                  className={`h-10 px-4 py-0 rounded font-semibold transition-all text-xs leading-none ${
                    filter === "overstocked"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Overstocked ({fs.os})
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilter("all")}
                  className={`h-10 px-4 py-0 rounded font-semibold transition-all text-xs leading-none ${
                    filter === "all"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Items ({fSC.all})
                </button>

                <button
                  onClick={() => setFilter("new")}
                  className={`h-10 px-4 py-0 rounded font-semibold transition-all text-xs leading-none ${
                    filter === "new"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  New ({fSC.new})
                </button>

                <button
                  onClick={() => setFilter("fair")}
                  className={`h-10 px-4 py-0 rounded font-semibold transition-all text-xs leading-none ${
                    filter === "fair"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Fair ({fSC.fair})
                </button>

                <button
                  onClick={() => setFilter("broken")}
                  className={`h-10 px-4 py-0 rounded font-semibold transition-all text-xs leading-none ${
                    filter === "broken"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Broken ({fSC.broken})
                </button>

                <button
                  onClick={() => setFilter("retired")}
                  className={`h-10 px-4 py-0 rounded font-semibold transition-all text-xs leading-none ${
                    filter === "retired"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Retired ({fSC.retired})
                </button>
              </div>
            )}
          </div>

          {/* Add/Edit Form Modal */}

          {showAddForm && !loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="rounded overflow-hidden bg-white px-1 shadow-2xl">
                <div className="bg-white rounded-xl w-full max-h-[95vh] overflow-y-auto custom-scrollbar">
                  <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-gray-900">
                      {editingItem
                        ? activeSection === "inventor`12y"
                          ? "Edit Inventory Item"
                          : activeSection === "crockery"
                          ? "Edit Crockery"
                          : "Edit Chemical Product"
                        : activeSection === "inventory"
                        ? "Add New Inventory Item"
                        : activeSection === "crockery"
                        ? "Add New Crockery"
                        : "Add New Chemical Product"}
                    </h2>
                    <X
                      size={20}
                      className="text-orange-500 hover:text-orange-600 cursor-pointer"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingItem(null);
                        setIsMenuItem(false);
                        resetForm();
                      }}
                    />
                  </div>

                  <form onSubmit={handleSubmit} className="p-6">
                    {/* INVENTORY FORM */}
                    {activeSection === "inventory" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={formData.category}
                            // onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            onChange={(e) => {
                              const selectedCat = cats.find(
                                (cat) => cat.name === e.target.value
                              );
                              setFormData({
                                ...formData,
                                category: selectedCat?.name || "",
                                catIcon: selectedCat?.icon || "",
                              });
                            }}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="">Select Category</option>
                            {categories.map((cat, index) => (
                              <option key={cat._id} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unit
                          </label>
                          <select
                            value={formData.unit}
                            onChange={(e) =>
                              setFormData({ ...formData, unit: e.target.value })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="">Select Unit</option>
                            <option value="kg">Kilogram (kg)</option>
                            <option value="g">Gram (g)</option>
                            <option value="l">Liter (l)</option>
                            <option value="ml">Milliliter (ml)</option>
                            <option value="pcs">Pieces (pcs)</option>
                            <option value="box">Box</option>
                            <option value="bottle">Bottle</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Current Stock
                          </label>
                          <input
                            type="number"
                            value={formData.currentStock}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                currentStock: Number.parseFloat(e.target.value),
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Minimum Stock
                          </label>
                          <input
                            type="number"
                            value={formData.minStock}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                minStock: Number.parseFloat(e.target.value),
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Maximum Stock
                          </label>
                          <input
                            type="number"
                            value={formData.maxStock}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                maxStock: Number.parseFloat(e.target.value),
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Cost Price
                          </label>
                          <input
                            type="number"
                            value={formData.costPrice}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                costPrice: Number.parseFloat(e.target.value),
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Supplier
                          </label>
                          <select
                            value={formData.supplier}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                supplier: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select Supplier</option>
                            {suppliers.map((supplier) => (
                              <option key={supplier._id} value={supplier.name}>
                                {supplier.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Storage Location
                          </label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                location: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., Freezer A, Pantry B"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                expiryDate: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Batch Number
                          </label>
                          <input
                            type="text"
                            value={formData.batchNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                batchNumber: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Batch/Lot number"
                          />
                        </div>
                      </div>
                    )}

                    {/* CROCKERY FORM */}
                    {activeSection === "crockery" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Core Fields for Crockery */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={formData.category}
                            onChange={(e) => {
                              const selectedCat = cats.find(
                                (cat) => cat.name === e.target.value
                              );
                              setFormData({
                                ...formData,
                                category: selectedCat?.name || "",
                                catIcon: selectedCat?.icon || "",
                              });
                            }}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="">Select Category</option>
                            {cats.map((cat, index) => (
                              <option key={index} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unit of Measure (UoM)
                          </label>
                          <select
                            value={formData.unit}
                            onChange={(e) =>
                              setFormData({ ...formData, unit: e.target.value })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="">Select Unit</option>
                            <option value="pcs">Pieces (pcs)</option>
                            <option value="set">Set</option>
                            <option value="dozen">Dozen</option>
                            <option value="box">Box</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantity on Hand
                          </label>
                          <input
                            type="number"
                            value={formData.currentStock}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                currentStock: Number.parseFloat(e.target.value),
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                            step="1"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Reorder Level (Par Stock)
                          </label>
                          <input
                            type="number"
                            value={formData.minStock}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                minStock: Number.parseFloat(e.target.value),
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                            step="1"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            SKU / Item Code
                          </label>
                          <input
                            type="text"
                            value={formData.sku}
                            onChange={(e) =>
                              setFormData({ ...formData, sku: e.target.value })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Department / Outlet
                          </label>
                          <input
                            type="text"
                            value={formData.department}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                department: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Purchase Price (per unit)
                          </label>
                          <input
                            type="number"
                            value={formData.costPrice}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                costPrice: Number.parseFloat(e.target.value),
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Vendor / Supplier
                          </label>
                          <select
                            value={formData.supplier}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                supplier: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select Supplier</option>
                            {suppliers.map((supplier) => (
                              <option key={supplier._id} value={supplier.name}>
                                {supplier.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Purchase Date / Acquisition Date
                          </label>
                          <input
                            type="date"
                            value={formData.purchaseDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                purchaseDate: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        {/* Recommended extra fields */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Brand / Manufacturer
                          </label>
                          <input
                            type="text"
                            value={formData.brand}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                brand: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., Noritake, Luminarc"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Material
                          </label>
                          <input
                            type="text"
                            value={formData.material}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                material: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., Bone China, Stainless Steel"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Size / Capacity
                          </label>
                          <input
                            type="text"
                            value={formData.size}
                            onChange={(e) =>
                              setFormData({ ...formData, size: e.target.value })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., 12-inch, 300ml"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Condition
                          </label>
                          <select
                            value={formData.condition}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                condition: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select</option>
                            <option value="New">New</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Broken">Broken</option>
                            <option value="Retired">Retired</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Storage Location
                          </label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                location: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., Storage Room A, Kitchen Cabinet"
                          />
                        </div>

                        {/* Optional fields */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Asset Tag / Code (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.assetTag}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                assetTag: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="If using barcodes/RFID"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Replacement Policy / Warranty (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.replacementPolicy}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                replacementPolicy: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., 1 year replacement warranty"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Stock Reduce Reason (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.stockReduce}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                stockReduce: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., because... stock is reduced"
                          />
                        </div>
                      </div>
                    )}

                    {/* HOUSEKEEPING/CHEMICAL FORM */}
                    {activeSection === "housekeeping" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Basic Info */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={formData.category}
                            onChange={(e) => {
                              const selectedCat = cats.find(
                                (cat) => cat.name === e.target.value
                              );
                              setFormData({
                                ...formData,
                                category: selectedCat?.name || "",
                                catIcon: selectedCat?.icon || "",
                              });
                            }}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="">Select Category</option>
                            {cats.map((cat, index) => (
                              <option key={index} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Stock Details */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unit of Measure (UoM)
                          </label>
                          <select
                            value={formData.unit}
                            onChange={(e) =>
                              setFormData({ ...formData, unit: e.target.value })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="">Select Unit</option>
                            <option value="l">Liter (l)</option>
                            <option value="ml">Milliliter (ml)</option>
                            <option value="kg">Kilogram (kg)</option>
                            <option value="g">Gram (g)</option>
                            <option value="bottle">Bottle</option>
                            <option value="pack">Pack</option>
                            <option value="pcs">Pieces (pcs)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantity on Hand
                          </label>
                          <input
                            type="number"
                            value={formData.currentStock}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                currentStock: Number.parseFloat(e.target.value),
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Minimum Stock Level
                          </label>
                          <input
                            type="number"
                            value={formData.minStock}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                minStock: Number.parseFloat(e.target.value),
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Maximum Stock Level
                          </label>
                          <input
                            type="number"
                            value={formData.maxStock}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                maxStock: Number.parseFloat(e.target.value),
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        {/* Tracking */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            SKU / Item Code
                          </label>
                          <input
                            type="text"
                            value={formData.sku}
                            onChange={(e) =>
                              setFormData({ ...formData, sku: e.target.value })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Department / Store
                          </label>
                          <select
                            value={formData.department}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                department: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select</option>
                            <option value="Housekeeping">Housekeeping</option>
                            <option value="Laundry">Laundry</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Kitchen">Kitchen</option>
                          </select>
                        </div>

                        {/* Procurement */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Purchase Price (per unit)
                          </label>
                          <input
                            type="number"
                            value={formData.costPrice}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                costPrice: Number.parseFloat(e.target.value),
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Supplier
                          </label>
                          <select
                            value={formData.supplier}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                supplier: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select Supplier</option>
                            {suppliers.map((supplier) => (
                              <option key={supplier._id} value={supplier.name}>
                                {supplier.name}
                              </option>
                            ))}
                            
                          </select>
                        </div>

                        {/* Expiry & Safety */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                expiryDate: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Storage Location
                          </label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                location: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Housekeeping store, Chemical room, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Safety Data Sheet (SDS) Link
                          </label>
                          <input
                            type="url"
                            value={formData.sdsUrl}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sdsUrl: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Hazard Classification
                          </label>
                          <select
                            value={formData.hazardClassification}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                hazardClassification: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select</option>
                            <option value="Flammable">Flammable</option>
                            <option value="Corrosive">Corrosive</option>
                            <option value="Toxic">Toxic</option>
                            <option value="Non-hazardous">Non-hazardous</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Stock Reduce Reason (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.stockReduce}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                stockReduce: e.target.value,
                              })
                            }
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., because... stock is reduced"
                          />
                        </div>
                      </div>
                    )}

                    {/* Menu Item Toggle for Inventory */}
                    {editingItem == null && activeSection == "inventory" && (
                      <div className="flex justify-end mt-5">
                        <div className="border border-gray-100 px-4 py-2 rounded bg-gray-50">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Include in menu Items:
                          </label>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setMenuFormData({
                                  name: formData.name || "",
                                  // nameEn: '',
                                  description: "",
                                  // descriptionEn:'',
                                  tax: "",
                                  hsnCode: "",
                                  skuCode: "",
                                  shortDescription: "",
                                  itemType: "retail",
                                  price: formData.costPrice || "",
                                  category: "",
                                  available: true,
                                  allergens: [],
                                  preparationTime: 0,
                                  image: "",
                                  extraImages: [],
                                  vegetarian: false,
                                  vegan: false,
                                  glutenFree: false,
                                  spicy: false,
                                  spicyLevel: 0,
                                  featured: false,
                                  ingredients: [],
                                  nutritionalInfo: {
                                    calories: 0,
                                    protein: 0,
                                    carbs: 0,
                                    fat: 0,
                                    fiber: 0,
                                    sugar: 0,
                                    sodium: 0,
                                  },
                                  servingSize: "",
                                  cookingMethod: "",
                                  origin: "",
                                  chefSpecial: false,
                                  seasonal: false,
                                  tags: [],
                                  portionSizes: [
                                    {
                                      name: "Regular",
                                      price: 0,
                                      description: "",
                                    },
                                  ],
                                });
                                setIsMenuItem(true);
                              }}
                              className={`h-9 px-4 py-0 rounded font-semibold transition-all text-xs leading-none border border-gray-300 mr-2 ${
                                isMenuItem
                                  ? "bg-orange-500 text-white"
                                  : "bg-white text-black"
                              }`}
                            >
                              Yes, Include
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsMenuItem(false)}
                              className={`h-9 px-4 py-0 rounded font-semibold transition-all text-xs leading-none border border-gray-300 ${
                                !isMenuItem
                                  ? "bg-orange-500 text-white"
                                  : "bg-white text-black"
                              }`}
                            >
                              No, Exclude
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ==================================================================================== */}

                    {isMenuItem && (
                      // {true && (
                      <div className="flex items-center justify-center z-50 mt-5">
                        <div className="bg-white rounded w-[70vw] overflow-y-auto border border-gray-100 custom-scrollbar">
                          <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-sm font-semibold text-gray-900">
                              {"Add Menu Item"}
                            </h2>

                            {/* <X
                    className="w-5 h-5 text-orange-500 cursor-pointer"
                    onClick={()=>setIsMenuItem(false)}
                    /> */}
                          </div>
                          <div className="px-6 py-2">
                            {/* <div className="grid grid-cols-2 lg:grid-cols-2 gap-8"> */}
                            <div className="flex gap-3">
                              {/* Left Column - Basic Info */}
                              <div className="space-y-3 w-[50%]">
                                {/* Name Section */}
                                <div className="bg-gray-50 px-4 py-2 rounded">
                                  <h3 className="text-xs font-medium text-gray-900 mb-2">
                                    Item Name
                                  </h3>
                                  <div className="">
                                    <div className="w-full">
                                      <input
                                        type="text"
                                        // value={menuFormData.name.en}
                                        value={menuFormData.name}
                                        onChange={(e) =>
                                          setMenuFormData({
                                            ...menuFormData,
                                            // name: { ...menuFormData.name, en: e.target.value }
                                            name: e.target.value,
                                          })
                                        }
                                        className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                        placeholder="name"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Descriptions */}
                                <div className="bg-gray-50 px-4 py-2 rounded">
                                  <h3 className="text-xs font-medium text-gray-900 mb-1">
                                    Descriptions
                                  </h3>

                                  {/* Short Description */}
                                  <div className="mb-2">
                                    <label className="block text-xs text-gray-700 mb-1">
                                      Short Description
                                    </label>
                                    <div className="">
                                      <div>
                                        <textarea
                                          value={menuFormData.shortDescription}
                                          onChange={(e) =>
                                            setMenuFormData({
                                              ...menuFormData,
                                              shortDescription: e.target.value,
                                            })
                                          }
                                          className="text-xs text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                          rows="2"
                                          placeholder="Brief description for menu display"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Full Description */}
                                  <div>
                                    <label className="block text-xs text-gray-700 mb-1">
                                      Full Description
                                    </label>
                                    <div className="">
                                      <div>
                                        <textarea
                                          // value={menuFormData.description.en}
                                          value={menuFormData.description}
                                          onChange={(e) =>
                                            setMenuFormData({
                                              ...menuFormData,
                                              description: e.target.value,
                                            })
                                          }
                                          className="text-xs text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                          rows="4"
                                          placeholder="Detailed description, cooking method, taste profile..."
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Ingredients */}

                                <div className="bg-gray-50 px-4 py-2 rounded max-w-2xl">
                                  <h3 className="text-xs font-medium text-gray-900 mb-2">
                                    Ingredients
                                  </h3>

                                  {/* Available Common Ingredients */}
                                  <div className="space-y-2 mb-2">
                                    {/* <h4 className="text-xs font-medium text-gray-700">Common Ingredients:</h4> */}
                                    <div className="flex flex-wrap gap-2">
                                      {commonIngredients.map((ingredient) => (
                                        <button
                                          key={ingredient}
                                          type="button"
                                          onClick={() =>
                                            handleIngredientToggle(ingredient)
                                          }
                                          className={`px-2 py-0 rounded text-xs border cursor-pointer transition-colors ${
                                            menuFormData.ingredients.includes(
                                              ingredient
                                            )
                                              ? "bg-green-100 text-green-800 border-green-300"
                                              : "bg-white text-green-600 border-green-200 hover:bg-green-50"
                                          }`}
                                        >
                                          {ingredient}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Selected Ingredients */}
                                  {menuFormData.ingredients.length > 0 && (
                                    <div className="border-t border-gray-200 pt-3">
                                      {/* Custom Selected Ingredients */}
                                      {customSelected.length > 0 && (
                                        <div className="mb-3 flex items-center">
                                          <div className="flex items-center">
                                            <span className="text-xs text-gray-600 mr-2">
                                              Custom:
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {customSelected.map(
                                              (ingredient) => (
                                                <button
                                                  key={`selected-custom-${ingredient}`}
                                                  type="button"
                                                  onClick={() =>
                                                    handleIngredientToggle(
                                                      ingredient
                                                    )
                                                  }
                                                  className="px-2 py-0 text-xs rounded border bg-blue-100 text-blue-800 border-blue-300 cursor-pointer transition-colors hover:opacity-80"
                                                >
                                                  {ingredient}
                                                  <span className="ml-1 font-bold">
                                                    ×
                                                  </span>
                                                </button>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Add Custom Ingredient */}
                                  <div className="mb-0 p-1 bg-gray-100 rounded border border-gray-200">
                                    {/* <h4 className="text-xs font-medium text-gray-700 mb-2">Add Custom Ingredient:</h4> */}
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={customIngredient}
                                        onChange={(e) =>
                                          setCustomIngredient(e.target.value)
                                        }
                                        onKeyPress={handleKeyPress}
                                        className="text-xs flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                        placeholder="Enter custom ingredient..."
                                      />
                                      <button
                                        type="button"
                                        onClick={handleAddCustomIngredient}
                                        disabled={!customIngredient.trim()}
                                        className="text-xs px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Nutritional Information */}
                                <div className="bg-gray-50 px-4 py-2 rounded">
                                  <h3 className="text-xs font-medium text-gray-900 mb-2">
                                    Nutritional Information (per serving)
                                  </h3>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <label className="block text-xs text-gray-700 mb-1">
                                        Calories
                                      </label>
                                      <input
                                        type="number"
                                        value={
                                          menuFormData.nutritionalInfo.calories
                                        }
                                        onChange={(e) =>
                                          setMenuFormData({
                                            ...menuFormData,
                                            nutritionalInfo: {
                                              ...menuFormData.nutritionalInfo,
                                              calories: Number(e.target.value),
                                            },
                                          })
                                        }
                                        className="text-xs w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        min="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-700 mb-1">
                                        Protein (g)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={
                                          menuFormData.nutritionalInfo.protein
                                        }
                                        onChange={(e) =>
                                          setMenuFormData({
                                            ...menuFormData,
                                            nutritionalInfo: {
                                              ...menuFormData.nutritionalInfo,
                                              protein: Number(e.target.value),
                                            },
                                          })
                                        }
                                        className="text-xs w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        min="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-700 mb-1">
                                        Carbs (g)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={
                                          menuFormData.nutritionalInfo.carbs
                                        }
                                        onChange={(e) =>
                                          setMenuFormData({
                                            ...menuFormData,
                                            nutritionalInfo: {
                                              ...menuFormData.nutritionalInfo,
                                              carbs: Number(e.target.value),
                                            },
                                          })
                                        }
                                        className="text-xs w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        min="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-700 mb-1">
                                        Fat (g)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={menuFormData.nutritionalInfo.fat}
                                        onChange={(e) =>
                                          setMenuFormData({
                                            ...menuFormData,
                                            nutritionalInfo: {
                                              ...menuFormData.nutritionalInfo,
                                              fat: Number(e.target.value),
                                            },
                                          })
                                        }
                                        className="text-xs w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        min="0"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Allergens */}
                                <div className="bg-gray-50 px-4 py-2 rounded max-w-md">
                                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                                    Allergens
                                  </h3>

                                  {/* Available Allergens */}
                                  <div className="space-y-2 mb-2">
                                    {/* <h4 className="text-xs font-medium text-gray-700">Available Allergens:</h4> */}
                                    <div className="flex flex-wrap gap-2">
                                      {commonAllergens.map((allergen) => (
                                        <button
                                          key={allergen}
                                          type="button"
                                          onClick={() =>
                                            handleAllergenToggle(allergen)
                                          }
                                          className={`px-2 py-0 rounded text-xs border cursor-pointer transition-colors ${
                                            menuFormData.allergens.includes(
                                              allergen
                                            )
                                              ? "bg-red-100 text-red-800 border-red-300"
                                              : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                                          }`}
                                        >
                                          {allergen}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Warning message for selected allergens */}
                                  {menuFormData.allergens.length > 0 && (
                                    <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                      <div className="flex items-center">
                                        <svg
                                          className="w-4 h-4 text-yellow-600 mr-2"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        <span className="text-xs text-yellow-800 font-medium">
                                          Contains allergens
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Column - Settings & Media */}
                              <div className="space-y-3 ">
                                {/* Image upload side by side */}
                                <div className="flex gap-2">
                                  {/* Image Upload */}
                                  <div className="bg-gray-50 px-4 py-2 rounded">
                                    <h3 className="text-xs font-medium text-gray-900 mb-2">
                                      Image
                                    </h3>
                                    <div className="text-center">
                                      {imagePreview ? (
                                        <div className="relative object-contain bg-red-50">
                                          <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-36 h-24 rounded object-contain"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setDeletedImages((prev) => [
                                                ...prev,
                                                imagePreview,
                                              ]);
                                              setImagePreview(null);
                                              setMenuFormData({
                                                ...menuFormData,
                                                image: "",
                                              });
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded px-1 py-0 text-xs"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="w-30 h-[15vh] bg-gray-200 rounded flex items-center justify-center">
                                          <span className="text-xs text-gray-500">
                                            No Image
                                          </span>
                                        </div>
                                      )}
                                      <span className="text-gray-500 text-xs">
                                        Recommended size: 16:9
                                      </span>
                                      <div className="mt-2">
                                        <div className="relative bg-orange-500 hover:bg-orange-700 text-white px-4 py-1 rounded cursor-pointer inline-block">
                                          <span className="text-xs">
                                            {uploadingImage
                                              ? "Uploading..."
                                              : "Upload Image"}
                                          </span>
                                          <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            disabled={uploadingImage}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Extra Images */}
                                  <div className="bg-gray-50 px-4 py-2 rounded">
                                    <h3 className="text-xs font-medium text-gray-900 mb-2">
                                      Extra Images (up to 5)
                                    </h3>

                                    {/* Upload button */}

                                    {/* Previews */}
                                    <div className="flex flex-wrap gap-3 mt-3">
                                      {extraImages.length > 0 ? (
                                        extraImages.map((src, index) => (
                                          <div
                                            key={index}
                                            className="relative bg-red-700 object-contain"
                                          >
                                            <img
                                              src={src}
                                              alt={`Extra ${index + 1}`}
                                              className="w-24 h-22 object-contain rounded"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const removed =
                                                  extraImages[index];
                                                // console.log(`Removed: ${removed} __blablabl`)
                                                setExtraImages(
                                                  extraImages.filter(
                                                    (_, i) => i !== index
                                                  )
                                                );

                                                if (
                                                  typeof removed === "string"
                                                ) {
                                                  setDeletedImages((prev) => [
                                                    ...prev,
                                                    removed,
                                                  ]);
                                                }

                                                setMenuFormData((prev) => ({
                                                  ...prev,
                                                  extraImages:
                                                    prev.extraImages.filter(
                                                      (_, i) => i !== index
                                                    ),
                                                }));
                                              }}
                                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded px-1 py-0 text-xs"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="bg-gray-200 px-8 py-7 rounded">
                                          <span className="text-gray-500 text-xs text-center w-full">
                                            No Extra Images
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="relative bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded cursor-pointer inline-block w-full text-center mt-3">
                                      <span className="w-full text-xs">
                                        {uploadingExtra
                                          ? "Uploading..."
                                          : "Upload Extra Images"}
                                      </span>
                                      <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleExtraImageUpload}
                                        accept="image/*"
                                        multiple
                                        disabled={uploadingExtra}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Basic Settings */}
                                <div className="bg-gray-50 px-4 py-2 rounded">
                                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                                    Basic Settings
                                  </h3>

                                  <div className="flex space-x-2 items-start">
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-xs text-gray-700 mb-1">
                                          Price (₹)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={menuFormData.price}
                                          onChange={(e) =>
                                            setMenuFormData({
                                              ...menuFormData,
                                              price: e.target.value,
                                            })
                                          }
                                          className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                          required
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs text-gray-700 mb-1">
                                          Preparation Time (minutes)
                                        </label>
                                        <input
                                          type="number"
                                          value={menuFormData.preparationTime}
                                          onChange={(e) =>
                                            setMenuFormData({
                                              ...menuFormData,
                                              preparationTime: Number.parseInt(
                                                e.target.value
                                              ),
                                            })
                                          }
                                          className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                          min="0"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs text-gray-700 mb-1">
                                          Cooking Method
                                        </label>
                                        <select
                                          value={menuFormData.cookingMethod}
                                          onChange={(e) =>
                                            setMenuFormData({
                                              ...menuFormData,
                                              cookingMethod: e.target.value,
                                            })
                                          }
                                          className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        >
                                          <option value="">
                                            Select Method
                                          </option>
                                          {cookingMethods.map((method) => (
                                            <option key={method} value={method}>
                                              {method}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-xs text-gray-700 mb-1">
                                          SKU Code
                                        </label>
                                        <input
                                          type="text"
                                          value={menuFormData.skuCode}
                                          onChange={(e) =>
                                            setMenuFormData({
                                              ...menuFormData,
                                              skuCode: e.target.value,
                                            })
                                          }
                                          className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                          placeholder="e.g. MN-PZ-SM-002"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-xs text-gray-700 mb-1">
                                          Category
                                        </label>
                                        <select
                                          value={menuFormData.category}
                                          onChange={(e) =>
                                            setMenuFormData({
                                              ...menuFormData,
                                              category: e.target.value,
                                            })
                                          }
                                          className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                          required
                                        >
                                          <option value="">
                                            Select Category
                                          </option>
                                          {/* {predefinedCategories.map((category) => ( */}
                                          {menuCategories.map(
                                            (category, index) => (
                                              <option
                                                key={index}
                                                value={category.name}
                                              >
                                                {category.name}
                                              </option>
                                            )
                                          )}
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-xs text-gray-700 mb-1">
                                          Serving Size
                                        </label>
                                        <input
                                          type="text"
                                          value={menuFormData.servingSize}
                                          onChange={(e) =>
                                            setMenuFormData({
                                              ...menuFormData,
                                              servingSize: e.target.value,
                                            })
                                          }
                                          className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                          placeholder="e.g., 1 plate, 250ml, 2 pieces"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs text-gray-700 mb-1">
                                          Tax (in %)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={menuFormData.tax || " "}
                                          onChange={(e) =>
                                            setMenuFormData({
                                              ...menuFormData,
                                              tax: e.target.value,
                                            })
                                          }
                                          className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                          placeholder="e.g. 5, 10, 15..."
                                          required
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs text-gray-700 mb-1">
                                          HSN/SAC Code
                                        </label>
                                        <input
                                          type="text"
                                          value={menuFormData.hsnCode}
                                          onChange={(e) =>
                                            setMenuFormData({
                                              ...menuFormData,
                                              hsnCode: e.target.value,
                                            })
                                          }
                                          className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                          placeholder="e.g. 2106"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {/* Dietary & Special Flags */}
                                <div className="bg-gray-50 px-4 py-2 rounded max-w-md">
                                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                                    Dietary & Special
                                  </h3>

                                  {/* Available Options */}
                                  <div className="space-y-2 mb-1">
                                    {/* <h4 className="text-xs font-medium text-gray-700">Available Options:</h4> */}
                                    <div className="flex flex-wrap gap-2">
                                      {dietaryOptions.map((option) => (
                                        <button
                                          type="button"
                                          key={option.key}
                                          onClick={() =>
                                            handleToggle(option.key)
                                          }
                                          className={`px-2 py-0 rounded text-xs border cursor-pointer transition-colors ${getColorClasses(
                                            option.color,
                                            menuFormData[option.key]
                                          )}`}
                                        >
                                          {option.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Spicy Level Slider */}
                                  {menuFormData.spicy && (
                                    <div className="mb-1 p-3 bg-red-50 rounded border border-red-200">
                                      <label className="block text-xs font-medium text-red-800 mb-1">
                                        Spicy Level (1-5)
                                      </label>
                                      <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={menuFormData.spicyLevel}
                                        onChange={(e) =>
                                          setMenuFormData({
                                            ...menuFormData,
                                            spicyLevel: Number(e.target.value),
                                          })
                                        }
                                        className="w-full accent-red-500"
                                      />
                                      <div className="flex justify-between text-xs text-red-600 mt-0">
                                        <span>Mild</span>
                                        <span>Medium</span>
                                        <span>Hot</span>
                                        <span>Very Hot</span>
                                        <span>Extreme</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {/* Tags */}
                                <div className="bg-gray-50 px-4 py-2 rounded max-w-md">
                                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                                    Tags
                                  </h3>

                                  {/* Available Tags */}
                                  <div className="space-y-2 mb-1">
                                    {/* <h4 className="text-xs font-medium text-gray-700">Available Tags:</h4> */}
                                    <div className="flex flex-wrap gap-2">
                                      {commonTags.map((tag) => (
                                        <button
                                          key={tag}
                                          type="button"
                                          onClick={() => handleTagToggle(tag)}
                                          className={`px-2 py-0 rounded text-xs border cursor-pointer transition-colors ${
                                            menuFormData.tags.includes(tag)
                                              ? "bg-orange-100 text-orange-800 border-orange-300"
                                              : "bg-white text-orange-600 border-orange-200 hover:bg-orange-50"
                                          }`}
                                        >
                                          {tag}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* <div className="flex justify-end space-x-3 mt-3 pt-3 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false)
                          setEditingItem(null)
                          setMenuFormData({
                            name: "",
                            description: "",
                            shortDescription: "",
                            price: "",
                            category: "",
                            available: true,
                            allergens: [],
                            preparationTime: 0,
                            image: "",
                            vegetarian: false,
                            vegan: false,
                            glutenFree: false,
                            spicy: false,
                            spicyLevel: 0,
                            featured: false,
                            ingredients: [],
                            nutritionalInfo: {
                              calories: 0,
                              protein: 0,
                              carbs: 0,
                              fat: 0,
                              fiber: 0,
                              sugar: 0,
                              sodium: 0
                            },
                            servingSize: "",
                            cookingMethod: "",
                            origin: "",
                            chefSpecial: false,
                            seasonal: false,
                            tags: [],
                            portionSizes: [
                              { name: "Regular", price: 0, description: "" }
                            ]
                          })
                          setImagePreview(null)
                          setDeletedImages([])
                        }}
                        className="px-4 py-2 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                      disabled={submitLoading}
                      onClick={() => handleMenuSubmit}
                        type="submit"
                        className="px-6 py-2 text-xs bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded hover:from-orange-700 hover:to-amber-700 font-semibold transition-all"
                      >
                        {editingItem ? "Update" : "Add"} Item
                      </button>
                    </div> */}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* =========================================================================================== */}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingItem(null);
                          resetForm();
                        }}
                        className="h-9 px-5 py-0 rounded font-semibold transition-all text-xs leading-none hover:bg-gray-50 border border-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="h-9 px-5 py-0 rounded font-semibold transition-all text-xs leading-none bg-orange-500 text-white hover:bg-orange-600"
                      >
                        {editingItem ? "Update" : "Add"} Item
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Table */}
          <div className="mt-4">
            {!loading && (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="bg-white rounded shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-orange-500">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-white">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-white">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-white">
                            Current Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-white">
                            {activeSection === "inventory" ? "Min/Max" : "Min"}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-white">
                            Cost Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-white">
                            {/* Status */}
                            {activeSection === "crockery"
                              ? "Condition"
                              : "Status"}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-white">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allInventory.map((item, index) => (
                          <tr key={item._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-xs font-medium text-gray-900">
                                  <span className="text-gray-800">
                                    {index + 1}.
                                  </span>{" "}
                                  {item.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.supplier}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-xs font-medium text-gray-900">
                                {item.currentStock} {item.unit}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                              {/* {item.minStock} / {item.maxStock} {item.unit} */}
                              {activeSection === "inventory"
                                ? item.minStock +
                                  " / " +
                                  item.maxStock +
                                  " " +
                                  item.unit
                                : item.minStock + " " + item.unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                              ₹{item.costPrice}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                // Get badge props once per render
                                const badge = getBadgeProps(item);

                                return (
                                  <span
                                    className={`px-3 py-1 text-xs rounded-full font-medium ${badge.color}`}
                                  >
                                    {badge.text}
                                  </span>
                                );
                              })()}
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-orange-500 hover:text-orange-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              const newStock = prompt("Enter new stock quantity:", item.currentStock)
                              if (newStock !== null) {
                                updateStock(item._id, Number.parseFloat(newStock), "adjustment")
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </td> */}

                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                              {/* Edit */}
                              <button
                                onClick={() => handleEdit(item)}
                                className="relative group text-orange-500 hover:text-orange-900 transition-colors"
                              >
                                <Pencil size={16} />
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
                                  Edit
                                </span>
                              </button>

                              {/* Adjust */}
                              <button
                                onClick={() => {
                                  const newStock = prompt(
                                    "Enter new stock quantity:",
                                    item.currentStock
                                  );
                                  if (newStock !== null) {
                                    updateStock(
                                      item._id,
                                      Number.parseFloat(newStock),
                                      "adjustment"
                                    );
                                  }
                                }}
                                className="relative group text-blue-600 hover:text-blue-900 transition-colors"
                              >
                                <Settings size={16} />
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
                                  Adjust
                                </span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() =>
                                  showAlert(
                                    "question",
                                    "Delete this item?",
                                    "Are you sure you want to delete this item?",
                                    [
                                      {
                                        text: "Yes",
                                        onPress: () => handleDelete(item._id),
                                      },
                                      { text: "No" },
                                    ]
                                  )
                                }
                                className="relative group text-red-600 hover:text-red-900 transition-colors"
                              >
                                <Trash2 size={16} />
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200">
                                  Delete
                                </span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div ref={loaderRef} className="mt-2 mb-3 w-full">
                    {!loading && hasMore && (
                      <div className="flex items-center justify-center space-x-2 text-xs">
                        <Loader className="animate-spin w-4 h-4 text-orange-500" />
                        <span>Loading more...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* { loading && (
              <div className="text-center py-16">
                <div className="bg-white rounded shadow-lg p-12 max-w-md mx-auto">
                  <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading inventory...</p>
                </div>
              </div>
              )
            }        */}

          {loading && allInventory.length === 0 && (
            <div className="text-center py-20 flex align-items-center justify-center">
              <div className="bg-white rounded shadow-lg py-10 px-12 max-w-md">
                <svg
                  className="mx-auto h-10 w-10 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  No inventory items found
                </h3>
              </div>
            </div>
          )}
        </div>
      </main>

      {submitLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

