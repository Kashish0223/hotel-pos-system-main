"use client"

import { useState, useEffect, useRef } from "react"
import AdminHeader from "@/components/AdminHeader"
// import ImageCarousel from '@/components/ImageCarousel'
import {useAuth} from "@/lib/auth"
import {LoaderCircle, X, Loader} from 'lucide-react'
import { useAlert } from "@/context/AlertContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import {useAuthToken} from "@/lib/useAuthToken"
export default function MenuManagement() {
  const { user, hasPermission } = useAuth()
  const [menuItems, setMenuItems] = useState([])
  const [cursor, setCursor] = useState('');
  // const [hasMore, setHasMore] = useState(true);
      const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);
  const {showAlert} = useAlert();
  const [menuCategories, setMenuCategories] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletedImages, setDeletedImages] = useState([]);
  const [editingItem, setEditingItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [expanded, setExpanded] = useState(false);
  const token = useAuthToken();
  const [formData, setFormData] = useState({
    // name: { en: "", ja: "" },
    name: '',
    nameEn: '',
    // description: { en: "", ja: "" },
    description:'',
    descriptionEn:'',
    tax:'',
    hsnCode: '',
    skuCode: '',
    shortDescription: '',
    itemType: 'kitchen',
    price: "",
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

  const [selectedItem, setSelectedItem] = useState(null); // store item to show in modal
  const [isModalOpen, setIsModalOpen] = useState(false); // modal open state

  // Allowed image types
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

  const handleShowMore = (item) => {
    setSelectedItem(item); // store clicked item
    setIsModalOpen(true);  // open modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const toggleExpand = (id) => {
  setExpanded((prev) => ({
    ...prev,
    [id]: !prev[id],
  }))
}



    const dietaryOptions = [
    { key: 'available', label: 'Available', color: 'green' },
    { key: 'vegetarian', label: 'Vegetarian', color: 'green' },
    { key: 'vegan', label: 'Vegan', color: 'green' },
    { key: 'glutenFree', label: 'Gluten Free', color: 'blue' },
    { key: 'spicy', label: 'Spicy', color: 'red' },
    { key: 'featured', label: 'Featured Item', color: 'purple' },
    { key: 'chefSpecial', label: 'Chef\'s Special', color: 'yellow' },
    { key: 'seasonal', label: 'Seasonal Item', color: 'orange' },
  ];

  const handleToggle = (key) => {
    setFormData({ ...formData, [key]: !formData[key] });
  };

    const handleTagToggle = (tag) => {
    if (formData.tags.includes(tag)) {
      setFormData({ 
        ...formData, 
        tags: formData.tags.filter(t => t !== tag) 
      });
    } else {
      setFormData({ 
        ...formData, 
        tags: [...formData.tags, tag] 
      });
    }
  };


   const handleAllergenToggle = (allergen) => {
    if (formData.allergens.includes(allergen)) {
      setFormData({ 
        ...formData, 
        allergens: formData.allergens.filter(a => a !== allergen) 
      });
    } else {
      setFormData({ 
        ...formData, 
        allergens: [...formData.allergens, allergen] 
      });
    }
  };

  const getColorClasses = (color, isSelected) => {
    const colorMap = {
      green: isSelected 
        ? 'bg-green-300 text-green-800 border-green-600' 
        : 'bg-white text-gray-500 border-green-300 hover:bg-green-50',
      blue: isSelected 
        ? 'bg-blue-300 text-green-800 border-blue-600' 
        : 'bg-white text-gray-500 border-blue-300 hover:bg-blue-50',
      red: isSelected 
        ? 'bg-red-300 text-red-800 border-red-600' 
        : 'bg-white text-gray-500 border-red-300 hover:bg-red-50',
      purple: isSelected 
        ? 'bg-purple-300 text-purple-800 border-purple-600' 
        : 'bg-white text-gray-500 border-purple-300 hover:bg-purple-50',
      yellow: isSelected 
        ? 'bg-yellow-300 text-yellow-800 border-yellow-600' 
        : 'bg-white text-gray-500 border-yellow-300 hover:bg-yellow-50',
      orange: isSelected 
        ? 'bg-orange-300 text-orange-800 border-orange-600' 
        : 'bg-white text-gray-500 border-orange-300 hover:bg-orange-50',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const selectedItems = dietaryOptions.filter(option => formData[option.key]);


   const [customIngredient, setCustomIngredient] = useState('');


     // Common ingredients
  const commonIngredients = [
    "Chicken", "Beef", "Pork", "Fish", "Shrimp", "Tofu", "Eggs",
    "Rice", "Noodles", "Pasta", "Bread", "Flour", "Milk", "Cheese",
    "Tomatoes", "Onions", "Garlic", "Ginger", "Soy Sauce", "Salt",
    "Pepper", "Oil", "Butter", "Cream", "Herbs", "Spices"
  ]


    // Separate common ingredients from custom ones
  const commonSelected = formData.ingredients.filter(ing => commonIngredients.includes(ing));
  const customSelected = formData.ingredients.filter(ing => !commonIngredients.includes(ing));
  
     const handleIngredientToggle = (ingredient) => {
    if (formData.ingredients.includes(ingredient)) {
      setFormData({ 
        ...formData, 
        ingredients: formData.ingredients.filter(i => i !== ingredient) 
      });
    } else {
      setFormData({ 
        ...formData, 
        ingredients: [...formData.ingredients, ingredient] 
      });
    }
  };

  const handleAddCustomIngredient = () => {
    const trimmedIngredient = customIngredient.trim();
    if (trimmedIngredient && !formData.ingredients.includes(trimmedIngredient)) {
      setFormData({ 
        ...formData, 
        ingredients: [...formData.ingredients, trimmedIngredient] 
      });
      setCustomIngredient('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomIngredient();
    }
  };


  const [imagePreview, setImagePreview] = useState(null)
  const [extraImages, setExtraImages] = useState([]);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false)
    // const [currentUser, setCurrentUser] = useState(null)
  //    useEffect(() => {
  //   const storedUser = localStorage.getItem("hotel_pos_user")
  //   if (storedUser) {
  //     setCurrentUser(JSON.parse(storedUser))
  //   }
  // }, [])

  // Predefined categories aligned with customer menu
  const predefinedCategories = [
    "Quick Menu",
    "Salad",
    "Egg Omelet",
    "Ala Carte",
    "Chinese",
    "Fried Items",
    "Croquette",
    "Seafood",
    "Pork",
    "Chicken",
    "Noodles",
    "Pasta",
    "Rice Dishes",
    "Tempura",
    "Sushi",
    "Ramen",
    "Appetizers",
    "Main Course",
    "Desserts",
    "Beverages",
    "Specials",
    "Soups"
  ]

  // found - 121212

  // Predefined allergens
  const commonAllergens = [
    "Gluten", "Dairy", "Eggs", "Fish", "Shellfish", "Tree Nuts", 
    "Peanuts", "Soy", "Sesame", "Mustard", "Celery", "Lupin"
  ]



  // Cooking methods
  const cookingMethods = [
    "Grilled", "Fried", "Steamed", "Boiled", "Baked", "Roasted",
    "Sautéed", "Stir-fried", "Deep-fried", "Pan-fried", "Braised",
    "Poached", "Smoked", "Raw", "Fermented"
  ]

  // Common tags
  const commonTags = [
    "Popular", "New", "Healthy", "Low Calorie", "High Protein",
    "Comfort Food", "Traditional", "Fusion", "Spicy", "Mild",
    "Sweet", "Savory", "Crispy", "Tender", "Fresh"
  ]


  //   useEffect(() => {
  //   fetchMenuCategories()
  // }, [])

  useEffect(() => {
  if (token) {
    fetchMenuItems(false);       // Load first page
    fetchMenuCategories();      // Load categories too
  }
}, [token]);

  const fetchMenuCategories = async () => {
    // setLoading(true)
    if(!token) return;
    try {
      const response = await fetch("/api/categories/manage",{
        headers:{
          Authorization: `Bearer ${token}`
        }
      })
      const data = await response.json()
      // console.log(`Categories: ${JSON.stringify(data)}`)
      setMenuCategories(data)
    } catch (error) {
      console.error("Error fetching menu items:", error)
    } finally {
      // setLoading(false) // stop loading
    }
  }



  // const fetchMenuItems = async (append = true, cursor = '') => {
  //   // console.log(`Fetching menu items with cursor: ${cursor} and append: ${append}`);
  //   if(!token) return;
  //   setLoading(true)
  //   try {
  //     const response = await fetch(`/api/menu?cursor=${cursor}`,{
  //       headers:{
  //         Authorization: `Bearer ${token}`
  //       }
  //     })
  //     const data = await response.json()
  //     // console.log(
  //     //   c.greenBright(
  //     //     `Finished fetching menu items: ${JSON.stringify(
  //     //       data,
  //     //       (key, value) =>
  //     //         typeof value === "string" && value.startsWith("data:image")
  //     //           ? value.slice(0, 10) + "...[truncated]"
  //     //           : value,
  //     //       2
  //     //     )}`
  //     //   )
  //     // );


  //     const combined = append ? [...menuItems, ...data.items] : data.items;
  


  //     if(data){
  //       if(append){
  //         setMenuItems(() => {

  //           const uniqueItems = Array.from(
  //             new Map(combined.map(item => [item._id, item])).values()
  //           )
  //           return uniqueItems;

  //         })
  //       } else {
  //         setMenuItems(combined);
  //       }
  //       // console.log(`The cursor is now: ${data.nextCursor}`)
  //       setCursor(data.nextCursor);
  //       setHasMore(!!data.nextCursor)
  //     }

      

  //   } catch (error) {
  //     console.error("Error fetching menu items:", error)
  //   } finally {
  //     setLoading(false) // stop loading
  //   }
  // }

//   const fetchMenuItems = async (append = false, nextCursor = '') => {
//   if (!token) return;

//   setLoading(!append);

//   try {
//     // Always send limit=30 (or higher if you want)
//     const params = new URLSearchParams({
//       limit: "30", // ← CRITICAL: always send limit
//     });

//     if (nextCursor && append) {
//       params.set("cursor", nextCursor);
//     }

//     const url = `/api/menu?${params.toString()}`;

//     const response = await fetch(url, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) throw new Error("Failed to fetch");

//     const data = await response.json();

//     const newItems = data.items || [];

//     if (append) {
//       setMenuItems((prev) => {
//         const existingIds = new Set(prev.map((i) => i._id));
//         const filtered = newItems.filter((i) => !existingIds.has(i._id));
//         return [...prev, ...filtered];
//       });
//     } else {
//       setMenuItems(newItems);
//     }

//     setCursor(data.nextCursor || "");
//     setHasMore(!!data.nextCursor);
//   } catch (error) {
//     console.error("Error fetching menu items:", error);
//     showAlert("error", "Error", "Failed to load menu items", [{ text: "OK" }]);
//   } finally {
//     setLoading(false);
//   }
// };

  
// const fetchMenuItems = async (append = false, nextCursor = '') => {
//   if (!token) return;

//   setLoading(!append);

//   try {
//     const params = new URLSearchParams({
//       limit: "30",
//       source:"admin"    });

//     if (append && cursor) {
//       params.set("cursor", cursor);
//     }

//     // CRITICAL: Add this to force cursor-based pagination
//     // Even without source=orders, sending cursor + limit works
//     // But to be safe, we can add a dummy param
//     // params.set("source", "admin"); // optional

//     const url = `/api/menu?${params.toString()}`;

//     const response = await fetch(url, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       throw new Error("Failed to fetch menu items");
//     }

//     const data = await response.json();

//     // Important: Only trust nextCursor if paginationType is "cursor"
//     if (data.paginationType === "cursor") {
//       const newItems = data.items || [];

//       if (append) {
//         setMenuItems((prev) => {
//           const existingIds = new Set(prev.map((i) => i._id));
//           const filtered = newItems.filter((i) => !existingIds.has(i._id));
//           return [...prev, ...filtered];
//         });
//       } else {
//         setMenuItems(newItems);
//       }

//       setCursor(data.cursor || "");
//       setHasMore(!!data.cursor);
//     } else {
//       // Fallback: if somehow page-based, stop infinite scroll
//       if (!append) {
//         setMenuItems(data.items || []);
//       }
//       setHasMore(false); // no infinite scroll
//     }
//   } catch (error) {
//     console.error("Error fetching menu items:", error);
//     showAlert("error", "Error", "Failed to load menu items", [{ text: "OK" }]);
//   } finally {
//     setLoading(false);
//   }
// };

// const fetchMenuItems = async (append = false) => {
//   if (!token) return;

//   setLoading(!append);

//   try {
//     const params = new URLSearchParams({
//       limit: "30",
//     });

//     if (append && cursor) {
//       params.set("cursor", cursor);
//     }

//     const response = await fetch(`/api/menu?${params}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     const data = await response.json();

//     const newItems = data.items || [];

//     setMenuItems(prev =>
//       append
//         ? [...prev, ...newItems.filter(i => !prev.some(p => p._id === i._id))]
//         : newItems
//     );

//     setCursor(data.nextCursor || "");
//     setHasMore(!!data.nextCursor);
//   } finally {
//     setLoading(false);
//   }
// };

// FINAL WORKING VERSION
// const fetchMenuItems = async (append = false, nextCursor = '') => {
//   if (!token) return;

//   setLoading(!append);

//   try {
//     const params = new URLSearchParams({
//       limit: "30",
//     });

//     // Only add cursor when appending (scroll)
//   if (nextCursor) {
//       params.set("cursor", nextCursor);
//     }

//     const url = `/api/menu?${params.toString()}`;

//     const response = await fetch(url, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) throw new Error("Failed to fetch");

//     const data = await response.json();

//     const newItems = data.items || [];

//     if (append) {
//       setMenuItems((prev) => {
//         const existingIds = new Set(prev.map((i) => i._id));
//         const filtered = newItems.filter((i) => !existingIds.has(i._id));
//         return [...prev, ...filtered];
//       });
//     } else {
//       setMenuItems(newItems);
//     }

//     // Update cursor and hasMore from response
//     setCursor(data.nextCursor || "");
//     setHasMore(!!data.nextCursor);

//   } catch (error) {
//     console.error("Error fetching menu items:", error);
//     showAlert("error", "Error", "Failed to load menu items", [{ text: "OK" }]);
//   } finally {
//     setLoading(false);
//   }
// };

const fetchMenuItems = async (append = false) => {
  if (!token) return;

  setLoading(!append);

  try {
    const params = new URLSearchParams({
      limit: "30",
    });

    if (append && cursor) {
      params.set("cursor", cursor);
    }

    const response = await fetch(`/api/menu?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch");

    const data = await response.json();
    const newItems = data.items || [];

    setMenuItems(prev =>
      append
        ? [...prev, ...newItems.filter(i => !prev.some(p => p._id === i._id))]
        : newItems
    );

    setCursor(data.nextCursor || "");
    setHasMore(!!data.nextCursor);

  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};



    useEffect(() => {    
    fetchMenuItems(false);
  },  [token])

  // useEffect(() => {
  //   const loader = loaderRef.current;
  // if (!loader) return;

  //   const scrollableDiv = document.querySelector('.menu-container')

    
  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       // console.log(`Currently intersecting: intersectionRatio: ${entries[0].isIntersecting}, hasmore: ${hasMore},Loading ${!loading}}`)
  //       if(entries[0].isIntersecting && hasMore){
  //         // console.log(`Fetching more menu items...`)
  //         fetchMenuItems(true,cursor)
  //       }
  //     },
  //     {threshold: 0.1, root: null}
  //   )

  //   observer.observe(loader);
  //   return () => {
  //     if(loader){
  //       observer.unobserve(loader);
  //     }
  //   }


  // }, [loaderRef, hasMore, loading, cursor])

// useEffect(() => {
//   const loader = loaderRef.current;
//   if (!loader || !hasMore || loading) return;

//   const observer = new IntersectionObserver(
//     (entries) => {
//       if (entries[0].isIntersecting && hasMore && !loading) {
//         fetchMenuItems(true, cursor); // pass current cursor
//       }
//     },
//     {
//       root: null,        // ← Use viewport (default)
//       threshold: 0.1,
//       rootMargin: "100px" // ← Optional: trigger a bit earlier
//     }
//   );

//   observer.observe(loader);

//   return () => {
//     if (loader) observer.unobserve(loader);
//   };
// }, [hasMore, loading, cursor, fetchMenuItems]); // ← All dependencies

// useEffect(() => {
//   if (!loaderRef.current || !hasMore || loading) return;

//   const observer = new IntersectionObserver(
//     ([entry]) => {
//       if (entry.isIntersecting) {
//         fetchMenuItems(true);
//       }
//     },
//     { rootMargin: "200px" }
//   );

//   observer.observe(loaderRef.current);
//   return () => observer.disconnect();
// }, [hasMore, loading, fetchMenuItems]);

// IntersectionObserver — CORRECT VERSION
useEffect(() => {
  const loader = loaderRef.current;
  if (!loader || !hasMore || loading) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchMenuItems(true, cursor); // ← PASS THE CURRENT CURSOR HERE
      }
    },
    {
      rootMargin: "300px", // Load early
    }
  );

  observer.observe(loader);

  return () => observer.unobserve(loader);
}, [hasMore, loading, cursor, fetchMenuItems]); // ← cursor is in dependencies!

  const handleSubmit = async (e) => {

      e.preventDefault()

      setSubmitLoading(true)

  let imageUrl = ""
  let extraImageUrls = []

  // 1️⃣ Upload main image if it's a new File
  if (formData.image instanceof File) {
    const formDataToSend = new FormData()
    formDataToSend.append("file", formData.image)

    const res = await fetch("/api/uploadMenuFile", {
      method: "POST",
      body: formDataToSend,
    })
    const data = await res.json()

    if (data.success) {
      imageUrl = data.url
    } else {
      // alert("Main image upload failed")
      showAlert("error", "Upload Error", "Main image upload failed", [{text: "Okay"}])

      return
    }
  }

  // 2️⃣ Upload extra images if they are new Files
  if (Array.isArray(formData.extraImages) && formData.extraImages.length > 0) {
    for (const file of formData.extraImages) {
      if (file instanceof File) {
        const fd = new FormData()
        fd.append("file", file)

        const res = await fetch("/api/uploadMenuFile", {
          method: "POST",
          body: fd,
        })
        const data = await res.json()
        if (data.success) {
          extraImageUrls.push(data.url)
        }
      }
    }
  }

  // 3️⃣ Final values (preserve old if not replaced, append new)
  const finalImageUrl =
    imageUrl || (typeof formData.image === "string" ? formData.image : "")

  const finalExtraImages = [
    ...(Array.isArray(formData.extraImages)
      ? formData.extraImages.filter((img) => typeof img === "string") // keep old URLs only
      : []),
    ...extraImageUrls, // newly uploaded ones
  ]

    try {
      const url = editingItem ? `/api/menu/${editingItem._id}` : "/api/menu"
      const method = editingItem ? "PUT" : "POST"

      // console.log(`From data menu: ${JSON.stringify(formData)}`)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // body: JSON.stringify(formData),
         body: JSON.stringify({
           ...formData,
           image: finalImageUrl, // send the S3 URL instead of the File object
           extraImages: finalExtraImages,
           deletedImages
         }),
      })

      if (response.ok) {
        fetchMenuItems()
        setShowAddForm(false)
        setEditingItem(null)
        setExtraImages([]);

        setFormData({
          // name: { en: "", ja: "" },
          name: "",
          nameEn: "",
          // description: { en: "", ja: "" },
          description:'',
          descriptionEn:'',
          shortDescription: '',
          tax: '',
          itemType: "kitchen",
          price: "",
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
      }
    } catch (error) {
      console.error("Error saving menu item:", error)
      
    }

    setSubmitLoading(false)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    
    // Handle multilingual name
    // let name = { en: "", ja: "" };
    // if (typeof item.name === 'object') {
    //   name = item.name;
    // } else {
    //   name = { en: item.name, ja: item.name };
    // }

    let name = "";
    if (typeof item.name === 'object') {
      name = item.name.en || item.name.ja || "";
    } else {
      name = item.name || item.nameEn;
    }
    
    // Handle multilingual description
    // let description = { en: "", ja: "" };
    // let description = { en: "", ja: "" };
    // if (typeof item.description === 'object') {
    //   description = item.description;
    // } else {
    //   description = { en: item.description, ja: item.description };
    // }


    let description = "";
    if (typeof item.description === 'object') {
      description = item.description.en || item.description.ja || "";
    } else {
      description = item.description || item.descriptionEn;
    }
    
    // Handle multilingual short description
    // let shortDescription = { en: "", ja: "" };
    // if (typeof item.shortDescription === 'object') {
    //   shortDescription = item.shortDescription;
    // } else {
    //   shortDescription = { en: item.shortDescription || "", ja: item.shortDescription || "" };
    // }

    let shortDescription = "";
    if (typeof item.shortDescription === 'object') {
      shortDescription = item.shortDescription.en || shortDescription.ja || "";
    } else {
      shortDescription = item.shortDescription;
    }

    setFormData({
      name: name,
      nameEn: name,
      description: description,
      descriptionEn: description,
      shortDescription: shortDescription,
      tax: item.tax || '',
      hsnCode: item.hsnCode || '',
      skuCode: item.skuCode || '',
      itemType: item.itemType || "kitchen",
      price: item.price,
      category: item.category,
      available: item.available,
      allergens: Array.isArray(item.allergens) ? item.allergens : [],
      preparationTime: item.preparationTime || 0,
      image: item.image || "",
      extraImages: Array.isArray(item.extraImages) ? item.extraImages : [],
      vegetarian: item.vegetarian || false,
      vegan: item.vegan || false,
      glutenFree: item.glutenFree || false,
      spicy: item.spicy || false,
      spicyLevel: item.spicyLevel || 0,
      featured: item.featured || false,
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
      nutritionalInfo: item.nutritionalInfo || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
      },
      servingSize: item.servingSize || "",
      cookingMethod: item.cookingMethod || "",
      origin: item.origin || "",
      chefSpecial: item.chefSpecial || false,
      seasonal: item.seasonal || false,
      tags: Array.isArray(item.tags) ? item.tags : [],
      portionSizes: Array.isArray(item.portionSizes) && item.portionSizes.length > 0 
        ? item.portionSizes 
        : [{ name: "Regular", price: 0, description: "" }]
    })
    setImagePreview(item.image)
    setExtraImages(item.extraImages)
    setShowAddForm(true)
  }
  
  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Create a local preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const imageUrl = reader.result
      // setFormData(prev => ({ ...prev, image: imageUrl }))
      setFormData(prev => ({ ...prev, image: file }))
      setImagePreview(imageUrl)
    }
    reader.readAsDataURL(file)
  }


  const handleExtraImageUpload = (e) => {
  const files = Array.from(e.target.files)
  if (!files.length) return

  // Restrict to max 5
  if (files.length + (formData.extraImages?.length || 0) > 5) {
    // alert("You can upload up to 5 extra images only.")
    showAlert("error", "Upload Error", "You can upload up to 5 extra images only.", [{text: "Okay"}])
    return
  }

  const previews = []
  const fileObjs = []

  files.forEach((file) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (reader.result) {
        previews.push(reader.result.toString())
        fileObjs.push(file)

        // When all files are processed
        if (previews.length === files.length) {
          setExtraImages((prev) => [...prev, ...previews]) // UI preview
          setFormData((prev) => ({
            ...prev,
            extraImages: [...(prev.extraImages || []), ...fileObjs], // store File objects
          }))
        }
      }
    }
    reader.readAsDataURL(file)
  })
}



  const handleExtraImageUpload22 = (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  // Restrict to max 5
  if (files.length + (formData.extraImages?.length || 0) > 5) {
    // alert("You can upload up to 5 extra images only.");
    showAlert("error", "Upload Error", "You can upload up to 5 extra images only.", [{text: "Okay"}]);
    return;
  }

  const newImages = [];

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        newImages.push(reader.result.toString());

        // When all files are processed, update state
        if (newImages.length === files.length) {
          setFormData((prev) => ({
            ...prev,
            extraImages: [...(prev.extraImages || []), ...newImages],
          }));
          setExtraImages((prev) => [...prev, ...newImages]);
        }
      }
    };
    reader.readAsDataURL(file);
  });
};


  const handleDelete = async (id) => {
    // if (confirm("Are you sure you want to delete this item?")) {
      try {
        const response = await fetch(`/api/menu/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (response.ok) {
          fetchMenuItems()
        }
      } catch (error) {
        console.error("Error deleting menu item:", error)
      }
    // }
  }

  return (
 hasPermission(user,"view_menu") && (
    <div className="min-h-screen bg-gray-50 custom-scrollbar">
<AdminHeader
  title="Menu Management"
  subtitle="Manage your restaurant menu items"
  breadcrumbs={[
    { label: "Dashboard", href: "/" },
    { label: "Menu Management" }
  ]}
  actionButton={
   hasPermission(user,["add_menu","manage_menu"]) && (
    // <ProtectedRoute  requiredPermission="add_menu" >
      <button
        onClick={() => {
          setImagePreview(null);
          setExtraImages([]);
          setFormData({
            name: "",
            nameEn: "",
            description: "",
            descriptionEn: "",
            shortDescription: "",
            price: "",
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
              sodium: 0
            },
            servingSize: "",
            cookingMethod: "",
            origin: "",
            chefSpecial: false,
            seasonal: false,
            tags: [],
            portionSizes: [{ name: "Regular", price: 0, description: "" }]
          });
          setEditingItem(null);
          setShowAddForm(true);
        }}
        className="bg-orange-500 text-white px-4 py-2 rounded font-semibold shadow-lg transition-all transform hover:scale-105 text-xs w-full sm:w-auto"
      >
        Add New Item
      </button>
    )
    
  }
/>
      <div className="max-w-full mx-2 px-5 sm:px-7 lg:px-8 py-8 bg-gray-50 mx-auto">
        {/* Add/Edit Form Modal */}
        {showAddForm && (
        // {true && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded w-[70vw]  max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar">
              <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-900">
                  {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                </h2>

                <X
                className="w-5 h-5 text-orange-500 cursor-pointer"
                onClick={()=>setShowAddForm(false)}
                />


              </div>
              <form onSubmit={handleSubmit} className="px-6 py-2">
             

                {/* <div className="grid grid-cols-2 lg:grid-cols-2 gap-8"> */}
                <div className="flex gap-3">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-3 w-[50%]">
                    {/* Name Section */}
                    <div className="bg-gray-50 px-4 py-2 rounded">
                      <h3 className="text-xs font-medium text-gray-900 mb-2">Item Name</h3>
                      <div className="">
                        <div className="w-full">
                      
                          <input
                            type="text"
                            // value={formData.name.en}
                            value={formData.name}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              // name: { ...formData.name, en: e.target.value } 
                              name: e.target.value 
                            })}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                            placeholder="name"
                          />
                        </div>
                   
                      </div>
                    </div>

                    {/* Descriptions */}
                    <div className="bg-gray-50 px-4 py-2 rounded">
                      <h3 className="text-xs font-medium text-gray-900 mb-1">Descriptions</h3>
                      
                      {/* Short Description */}
                      <div className="mb-2">
                        <label className="block text-xs text-gray-700 mb-1">Short Description</label>
                        <div className="">
                          <div>
                        

                            <textarea
                              value={formData.shortDescription}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                shortDescription: e.target.value
                              })}
                              className="text-xs text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                              rows="2"
                              placeholder="Brief description for menu display"
                            />
                          </div>
                      
                        </div>
                      </div>

                      {/* Full Description */}
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">Full Description</label>
                        <div className="">
                          <div>
                      
                            <textarea
                              // value={formData.description.en}
                              value={formData.description}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                description: e.target.value
                              })}
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
      <h3 className="text-xs font-medium text-gray-900 mb-2">Ingredients</h3>

      {/* Available Common Ingredients */}
      <div className="space-y-2 mb-2">
        {/* <h4 className="text-xs font-medium text-gray-700">Common Ingredients:</h4> */}
        <div className="flex flex-wrap gap-2">
          {commonIngredients.map((ingredient) => (
            <button
              key={ingredient}
              type="button"
              onClick={() => handleIngredientToggle(ingredient)}
              className={`px-2 py-0 rounded text-xs border cursor-pointer transition-colors ${
                formData.ingredients.includes(ingredient)
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-white text-green-600 border-green-200 hover:bg-green-50'
              }`}
            >
              {ingredient}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Ingredients */}
      {formData.ingredients.length > 0 && (
        <div className="border-t border-gray-200 pt-3">
          {/* <h4 className="text-xs font-medium text-gray-700 mb-2">Selected Ingredients ({formData.ingredients.length}):</h4> */}
          
          {/* Custom Selected Ingredients */}
          {customSelected.length > 0 && (
            <div className="mb-3 flex items-center">
              <div className="flex items-center">              
                <span className="text-xs text-gray-600 mr-2">Custom:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {customSelected.map((ingredient) => (
                  <button
                    key={`selected-custom-${ingredient}`}
                    type="button"
                    onClick={() => handleIngredientToggle(ingredient)}
                    className="px-2 py-0 text-xs rounded border bg-blue-100 text-blue-800 border-blue-300 cursor-pointer transition-colors hover:opacity-80"
                  >
                    {ingredient}
                    <span className="ml-1 font-bold">×</span>
                  </button>
                ))}
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
            onChange={(e) => setCustomIngredient(e.target.value)}
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
                      <h3 className="text-xs font-medium text-gray-900 mb-2">Nutritional Information (per serving)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Calories</label>
                          <input
                            type="number"
                            value={formData.nutritionalInfo.calories}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              nutritionalInfo: { 
                                ...formData.nutritionalInfo, 
                                calories: Number(e.target.value) 
                              } 
                            })}
                            className="text-xs w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Protein (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.nutritionalInfo.protein}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              nutritionalInfo: { 
                                ...formData.nutritionalInfo, 
                                protein: Number(e.target.value) 
                              } 
                            })}
                            className="text-xs w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Carbs (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.nutritionalInfo.carbs}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              nutritionalInfo: { 
                                ...formData.nutritionalInfo, 
                                carbs: Number(e.target.value) 
                              } 
                            })}
                            className="text-xs w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Fat (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.nutritionalInfo.fat}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              nutritionalInfo: { 
                                ...formData.nutritionalInfo, 
                                fat: Number(e.target.value) 
                              } 
                            })}
                            className="text-xs w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>



                    {/* Allergens */}
                    <div className="bg-gray-50 px-4 py-2 rounded max-w-md">
      <h3 className="text-sm font-medium text-gray-900 mb-2">Allergens</h3>
      
      {/* Available Allergens */}
      <div className="space-y-2 mb-2">
        {/* <h4 className="text-xs font-medium text-gray-700">Available Allergens:</h4> */}
        <div className="flex flex-wrap gap-2">
          {commonAllergens.map((allergen) => (
            <button
              key={allergen}
              type="button"
              onClick={() => handleAllergenToggle(allergen)}
              className={`px-2 py-0 rounded text-xs border cursor-pointer transition-colors ${
                formData.allergens.includes(allergen)
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
              }`}
            >
              {allergen}
            </button>
          ))}
        </div>
      </div>

      {/* Warning message for selected allergens */}
      {formData.allergens.length > 0 && (
        <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-yellow-800 font-medium">Contains allergens</span>
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
                      <h3 className="text-xs font-medium text-gray-900 mb-2">Image</h3>
                      <div className="text-center">
                        {/* {imagePreview ? (
                          <div className="relative object-contain bg-red-50">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-36 h-24 rounded object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => {                               
                              setDeletedImages((prev) => [...prev, imagePreview]);    
                                setImagePreview(null)
                                setFormData({ ...formData, image: "" })
                              }}
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded px-1 py-0 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="w-30 h-[15vh] bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">No Image</span>
                          </div>
                        )} */}
                        {imagePreview ? (
  <div className="relative object-contain bg-red-50">
    <img
      src={imagePreview}
      alt="Preview"
      className="w-36 h-24 rounded object-contain"
    />
    {/* Show image type */}
    <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
      {formData.image instanceof File 
        ? formData.image.type.split('/')[1].toUpperCase()
        : imagePreview.includes('webp') ? 'WEBP' 
          : imagePreview.includes('png') ? 'PNG' 
          : imagePreview.includes('jpeg') || imagePreview.includes('jpg') ? 'JPG' 
          : 'UNKNOWN'}
    </div>
    <button
      type="button"
      onClick={() => {
        setDeletedImages((prev) => [...prev, imagePreview]);
        setImagePreview(null)
        setFormData({ ...formData, image: "" })
      }}
      className="absolute -top-2 -right-2 bg-red-600 text-white rounded px-1 py-0 text-xs"
    >
      ×
    </button>
  </div>
) : (
  <div className="w-30 h-[15vh] bg-gray-200 rounded flex items-center justify-center">
    <span className="text-xs text-gray-500">No Image</span>
  </div>
)}
                        <span className="text-gray-500 text-xs">Recommended size: 16:9</span>
                        <div className="mt-2">
                          <div className="relative bg-orange-500 hover:bg-orange-700 text-white px-4 py-1 rounded cursor-pointer inline-block">
                            <span className="text-xs">{uploadingImage ? "Uploading..." : "Upload Image"}</span>
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
  extraImages.map((src, index) => {
    const currentFileOrUrl = formData.extraImages[index];
    const isFile = currentFileOrUrl instanceof File;
    const fileType = isFile 
      ? currentFileOrUrl.type.split('/')[1].toUpperCase()
      : src.includes('webp') ? 'WEBP'
        : src.includes('png') ? 'PNG'
        : src.includes('jpg') || src.includes('jpeg') ? 'JPG'
        : 'UNKNOWN';

    return (
      <div key={index} className="relative bg-red-700 object-contain">
        <img
          src={src}
          alt={`Extra ${index + 1}`}
          className="w-24 h-22 object-contain rounded"
        />
        {/* Image type badge */}
        <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded text-center">
          {fileType}
        </div>
        <button
          type="button"
          onClick={() => {
            const removed = extraImages[index];
            setExtraImages(extraImages.filter((_, i) => i !== index));
            if (typeof removed === "string") {
              setDeletedImages((prev) => [...prev, removed]);
            }
            setFormData((prev) => ({
              ...prev,
              extraImages: prev.extraImages.filter((_, i) => i !== index),
            }));
          }}
          className="absolute -top-2 -right-2 bg-red-600 text-white rounded px-1 py-0 text-xs"
        >
          ×
        </button>
      </div>
    );
  })
) : (
  <div className="bg-gray-200 px-8 py-7 rounded">
    <span className="text-gray-500 text-xs text-center w-full">No Extra Images</span>
  </div>
)}
    {/* {extraImages.length > 0 ? (
      extraImages.map((src, index) => (
        <div key={index} className="relative bg-red-700 object-contain">
          <img
            src={src}
            alt={`Extra ${index + 1}`}
            className="w-24 h-22 object-contain rounded"
          />
          <button
            type="button"
            onClick={() => {

                const removed = extraImages[index];
                // console.log(`Removed: ${removed} __blablabl`)
    setExtraImages(extraImages.filter((_, i) => i !== index));

    if (typeof removed === "string") {
      setDeletedImages((prev) => [...prev, removed]);
    }

    setFormData((prev) => ({
      ...prev,
      extraImages: prev.extraImages.filter((_, i) => i !== index),
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
        <span className="text-gray-500 text-xs text-center w-full">No Extra Images</span>
      </div>
    )} */}
  </div>

   <div className="relative bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded cursor-pointer inline-block w-full text-center mt-3">
    <span className="w-full text-xs">{uploadingExtra ? "Uploading..." : "Upload Extra Images"}</span>
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
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Basic Settings</h3>
                      <div className="flex space-x-2 items-start">
                        <div className="space-y-3">

                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          />
                        </div>



                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Preparation Time (minutes)</label>
                          <input
                            type="number"
                            value={formData.preparationTime}
                            onChange={(e) => setFormData({ ...formData, preparationTime: Number.parseInt(e.target.value) })}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Cooking Method</label>
                          <select
                            value={formData.cookingMethod}
                            onChange={(e) => setFormData({ ...formData, cookingMethod: e.target.value })}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select Method</option>
                            {cookingMethods.map((method) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 mb-1">SKU Code</label>
                          <input
                            type="text"
                            value={formData.skuCode}
                            onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g. MN-PZ-SM-002"
                          />
                        </div>

                        </div>

                        <div className="space-y-3">



                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Category</label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="">Select Category</option>
                            {/* {predefinedCategories.map((category) => ( */}
                            {menuCategories .filter((category) => category.active === true).map((category, index) => (
                              <option key={index} value={category.name}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Serving Size</label>
                          <input
                            type="text"
                            value={formData.servingSize}
                            onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g., 1 plate, 250ml, 2 pieces"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Tax (in %)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.tax || ' '}
                            onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g. 5, 10, 15..."
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 mb-1">HSN/SAC Code</label>
                          <input
                            type="text"
                            value={formData.hsnCode}
                            onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                            className="text-xs w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g. 2106"
                          />
                        </div>

                        </div>



                      </div>
                    </div>

                    

                    {/* Dietary & Special Flags */}
                     <div className="bg-gray-50 px-4 py-2 rounded max-w-md">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Dietary & Special</h3>
      
      {/* Available Options */}
      <div className="space-y-2 mb-1">
        {/* <h4 className="text-xs font-medium text-gray-700">Available Options:</h4> */}
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((option) => (
            <button
              type="button"
              key={option.key}
              onClick={() => handleToggle(option.key)}
              className={`px-2 py-0 rounded text-xs border cursor-pointer transition-colors ${getColorClasses(option.color, formData[option.key])}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spicy Level Slider */}
      {formData.spicy && (
        <div className="mb-1 p-3 bg-red-50 rounded border border-red-200">
          <label className="block text-xs font-medium text-red-800 mb-1">Spicy Level (1-5)</label>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.spicyLevel}
            onChange={(e) => setFormData({ ...formData, spicyLevel: Number(e.target.value) })}
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
      <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
      
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
                formData.tags.includes(tag)
                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                  : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'
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

                <div className="flex justify-end space-x-3 mt-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingItem(null)
                      setFormData({
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
                    type="submit"
                    className="px-6 py-2 text-xs bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded hover:from-orange-700 hover:to-amber-700 font-semibold transition-all"
                  >
                    {editingItem ? "Update" : "Add"} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu Items Grid */}

        <div className="menu-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {menuItems.map((item) => (
            <div key={item._id} className="bg-white rounded-lg border-[1px] scale-100 border-black-100 shadow-md overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105">
   
              <div className="h-40 bg-white relative">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={typeof item.name === 'object' ? item.name.en : item.name ?? item.nameEn ?? item.name.ja ?? ""} 
                    className="w-full h-full object-cover bg-red-400" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Status Badge */}
                <span
                  className={`absolute top-2 right-2 px-3 py-1 text-xs rounded-full font-medium ${
                    item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.available ? "Available" : "Unavailable"}
                </span>
                
                {/* Category Badge */}
                <span className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-70 text-white px-3 py-1 rounded-full">
                  {item.category}
                </span>
              </div>

              {/* ================================== */}
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-md font-bold text-gray-900">
                      { item?.name ?? item?.nameEn ?? item?.name?.en ?? item?.name?.ja ?? "" }

                      {/* {typeof item.name === 'object' && item.name.ja && (
                        <span className="block text-sm text-gray-500 mt-1 font-normal">{item?.name ?? item?.name?.en ?? item?.nameEn ?? item?.name.ja ?? ""} bla</span>
                      )} */}
                    </h3>
                    {item.cookingMethod && (
                      <span className="text-xs text-gray-500 italic">{item.cookingMethod}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-orange-600">₹{item.price}</span>
                    {item.servingSize && (
                      <div className="text-xs text-gray-500">{item.servingSize}</div>
                    )}
                  </div>
                </div>



                {/* Short Description */}
                {expanded[item._id] && item.shortDescription && (
                  <p className="text-gray-600 text-sm mb-2 leading-relaxed font-medium">
                    {typeof item.shortDescription === 'object' ? item.shortDescription.en : item.shortDescription}
                  </p>
                )}

                {/* Full Description */}
                {/* <p className="text-gray-600 text-xs mb-4 leading-relaxed">
                  {typeof item.description === 'object' ? item.description.en : item.description}
                </p> */}


{expanded[item._id] && (

  <p className="text-gray-600 text-xs mb-4 leading-relaxed">
  {typeof item.description === "object" && item.description !== null
    ? item.description.en
    : item.description}
</p>
  )}


                {/* Ingredients Preview */}
                {item.ingredients && item.ingredients.length > 0 && (
                  <div className="mb-1">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Main Ingredients:</p>
                    <p className="text-xs text-gray-600">
                      {item.ingredients.slice(0, 4).join(', ')}
                      {item.ingredients.length > 4 && '...'}
                    </p>
                  </div>
                )}

                {/* Nutritional Info Preview */}
                { expanded[item._id] && item.nutritionalInfo && item.nutritionalInfo.calories > 0 && (
                  <div className="mb-4 p-2 bg-gray-50 rounded">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-xs font-semibold text-gray-700">{item.nutritionalInfo.calories}</div>
                        <div className="text-xs text-gray-500">cal</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-700">{item.nutritionalInfo.protein}g</div>
                        <div className="text-xs text-gray-500">protein</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-700">{item.nutritionalInfo.carbs}g</div>
                        <div className="text-xs text-gray-500">carbs</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-700">{item.nutritionalInfo.fat}g</div>
                        <div className="text-xs text-gray-500">fat</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Allergens */}
                { expanded[item._id] && item.allergens && item.allergens.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-red-700 mb-1">Contains:</p>
                    <p className="text-xs text-red-600">
                      {Array.isArray(item.allergens) ? item.allergens.join(', ') : item.allergens}
                    </p>
                  </div>
                )}


                {expanded[item._id] && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {item.vegetarian && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      🌱 Vegetarian
                    </span>
                  )}

                  {item.vegan && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      🌿 Vegan
                    </span>
                  )}

                  {item.glutenFree && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      🌾 Gluten Free
                    </span>
                  )}
                  
                  {item.spicy && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      🌶️ Spicy {item.spicyLevel && `(${item.spicyLevel}/5)`}
                    </span>
                  )}
                  
                  {item.featured && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      ⭐ Featured
                    </span>
                  )}

                  {item.chefSpecial && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      👨‍🍳 Chef's Special
                    </span>
                  )}

                  {item.seasonal && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      🍂 Seasonal
                    </span>
                  )}
                  
                  {item.preparationTime > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {item.preparationTime} min
                    </span>
                  )}
                  
                  {/* {item.allergens && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Allergens: {item.allergens}
                    </span>
                  )} */}
                </div>

                )}         

                <button className="text-xs text-amber-600 hover:underline text-right w-full mb-2 px-1" onClick={() => toggleExpand(item._id)}>
                  {expanded[item._id] ? 'Show Less' : 'Show More'}
                </button>

                <div className="flex space-x-2">
                {hasPermission(user,"edit_menu") &&
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                }
                {hasPermission(user, "delete_menu") &&
                  <button
                    onClick={() => showAlert("question","Delete this item?","Are you sure you want to delete this item?",[{ text: "Yes", onPress: () =>  handleDelete(item._id)},{ text: "No" }]) }  
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                }
                </div>
              </div>
            </div>
          ))}
             </div>
           <div ref={loaderRef} className="text-xs mt-5">
                { hasMore && (
                  <div className="flex items-center justify-center">
                  <Loader className="w-4 h-4 text-orange-500 animate-spin" />
                  <span className="ml-2">Loading more items...</span>
                  </div>
              )}
            </div>
        </div>

        { loading && !hasMore && (
          <div className="text-center py-16">
            <div className="bg-white rounded shadow-lg p-12 max-w-md mx-auto">
              <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading menu...</p>
            </div>
          </div>
          )
        }       


        {menuItems.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded shadow-lg p-12 max-w-md mx-auto">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No menu items</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first menu item.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded hover:from-orange-700 hover:to-amber-700 font-semibold transition-all"
              >
                Add First Item
              </button>
            </div>
          </div>
        )}
      </div>

      {submitLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

    </div>
 )
  )
}
