"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Clock, Users, Star, ChefHat, Leaf, Flame, ShieldCheck } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useKeenSlider } from "keen-slider/react";
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import { useAuthToken } from "@/lib/useAuthToken";
import ImageCarousel from '@/components/ImageSwiper'


export default function MenuItemDetail() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  // const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState(0)
  const [showNutrition, setShowNutrition] = useState(false)
  const [showIngredients, setShowIngredients] = useState(false)
  const [showAllergens, setShowAllergens] = useState(false)
  const token = useAuthToken();
  const tableNumber = searchParams.get('table')
  // console.log(`Table Number: ${tableNumber}`)
    // const tableNumber = searchParams.get("table");

  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem("tableNumber", tableNumber);
    }
  }, [tableNumber]);

  const { cart, updateQuantity, addToCart } = useCart();

  // console.log(`current cart: ${JSON.stringify(cart,null,2)}`)
let qt;
  let id;

  // Helper function to get category-specific default image
  const getDefaultImage = (category) => {
    const categoryImages = {
      'salad': '/images/salad-default.svg',
      'ramen': '/images/ramen-default.svg',
      'sushi': '/images/sushi-default.svg',
      'chinese': '/images/default-food.svg',
      'karaage_fried': '/images/default-food.svg',
      'seafood': '/images/default-food.svg',
      'pork': '/images/default-food.svg',
      'chicken': '/images/default-food.svg',
      'noodles': '/images/ramen-default.svg',
      'pasta': '/images/default-food.svg',
      'curry_rice': '/images/default-food.svg',
      'omurice_chahan': '/images/default-food.svg',
      'tempura': '/images/default-food.svg',
      'donburi': '/images/default-food.svg'
    }
    return categoryImages[category] || '/images/default-food.svg'
  }


    
    
  let allImages;

  useEffect(() => {
    if(!token) return;
    if (params.id) {
      fetchMenuItem()
    }
  }, [params.id,token])

  const fetchMenuItem = async () => {
    
    if (!token) return;
    try {
      const response = await fetch(`/api/menu/${params.id}`,{
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // console.log(`Item Data: ${JSON.stringify(data,null,2)}`)
        // id = data._id;
        const modData = {
          ...data,
          id: data._id
        };
        // setItem(data)
       allImages = [modData.image, ...(modData.extraImages || [])];
        setItem(modData)
      }
    } catch (error) {
      console.error("Error fetching menu item:", error)
    } finally {
      setLoading(false)
    }
  }

// useEffect(() => {
//   const itemInCart = cart.find((cartItem) => cartItem.id === item?._id);
//   const newQuantity = itemInCart ? itemInCart.quantity : 1;
//   setQuantity(newQuantity);
// }, [item, cart]); // only depend on things that actually matter





// }, [item])


  // Get this item's quantity from the cart (or default to 1 if not there)
  const itemInCart = cart.find(c => c.id === item?._id);
  const quantity = itemInCart ? itemInCart.quantity : 0;

  const handleDecrease = () => {
    const newQuantity = Math.max(quantity - 1, 0);
    updateQuantity(item._id, newQuantity);
  };

  const handleIncrease = () => {
    const newQuantity = quantity + 1;
    updateQuantity(item._id, newQuantity);
  };

    const handleAdd = () => {
    const newQuantity = 1;
    updateQuantity(item._id, newQuantity);
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: item._id,
      name: typeof item.name === 'object' ? item.name.en : item.name,
      price: item.price,
      quantity: quantity,
      image: item.image,
      preparationTime: item.preparationTime || 0
    }

    // Get existing cart
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
    
    // Check if item already exists
    const existingItemIndex = existingCart.findIndex(cartItem => cartItem.id === item._id)
    
    if (existingItemIndex > -1) {
      // Update quantity
      existingCart[existingItemIndex].quantity += quantity
    } else {
      // Add new item
      existingCart.push(cartItem)
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(existingCart))
    
    // Navigate back to menu with table parameter
    router.push(`/customer/menu${tableNumber ? `?table=${tableNumber}` : ''}`)
  }

  const handleBack = () => {
    router.push(`/customer/menu${tableNumber ? `?table=${tableNumber}` : ''}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        {/* <CustomerHeader /> */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        {/* <CustomerHeader /> */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-white text-xl mb-4">Item not found</div>
            <div className="text-gray-400 text-sm mb-4">
              Item ID: {params.id}
            </div>
            <button
              onClick={handleBack}
              className="bg-amber-500 hover:bg-amber-600 rounded-lg text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  const itemName = typeof item.name === 'object' ? item.name.en : item.name
  const itemDescription = typeof item.description === 'object' ? item.description.en : item.description
  const itemShortDescription = typeof item.shortDescription === 'object' ? item.shortDescription.en : item.shortDescription

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      {/* <CustomerHeader/> */}
      
      {/* Back Button */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-b border-amber-500/20">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button
            onClick={handleBack}
            className="flex bg-amber-500 rounded-xl p-2 text-xs items-center text-white hover:text-amber-300 transition-colors"          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </button>
        </div>
      </div>

<div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden mb-0">
          {/* Image */}
<div className="relative h-64 sm:h-72 md:h-68 mb-4 md:mb-0">

            {/* {item.image && item.image !== '/placeholder.svg?height=200&width=200' && !item.image.includes('placeholder') ? (
              <img
                src={item.image}
                alt={itemName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If dynamic image fails, show fallback
                  e.target.style.display = 'none';
                  const fallbackDiv = e.target.nextElementSibling;
                  if (fallbackDiv) {
                    fallbackDiv.style.display = 'flex';
                  }
                }}
              />
            ) : null} */}

            {item.image && item.image !== '/placeholder.svg?height=200&width=200' && !item.image.includes('placeholder') ? (


            <ImageCarousel images={[item.image, ...(item.extraImages || [])]} />

            ) : null}











            
            {/* Fallback display */}
            <div className={`relative w-full h-full ${item.image && item.image !== '/placeholder.svg?height=200&width=200' && !item.image.includes('placeholder') ? 'hidden' : 'block'}`}>
              <img
                src={getDefaultImage(item.category)}
                alt={itemName}
                className="w-full h-full object-cover"
              />


              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col items-center justify-end py-8">
                <h2 className="text-lg font-serif text-white text-center">
                  {itemName}
                </h2>
              </div>
            </div>
            
            {/* Overlay Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {item.featured && (
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Featured
                </span>
              )}
              {item.chefSpecial && (
                <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <ChefHat className="w-4 h-4 mr-1" />
                  Chef's Special
                </span>
              )}
              {item.seasonal && (
                <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  🍂 Seasonal
                </span>
              )}
            </div>

            {/* Status Badge */}
            {/* <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                item.available 
                  ? "bg-green-600 text-white" 
                  : "bg-red-600 text-white"
              }`}>
                {item.available ? "Available" : "Unavailable"}
              </span>
            </div> */}

            {/* Category Badge */}
           
          </div>

          {/* Content */}
          {/* <div className="p-4 md:p-8"> */}
          <div className="p-4 md:p-4 -mt-4 md:-mt-6">
             <div className="mb-2">
              <span className="bg-amber-600 text-white text-white font-normal px-4 py-1 rounded-xl text-xs font-medium">
                {item.category}
              </span>
            </div>
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h1 className="text-md md:text-3xl font-bold text-gray-900">
                  {itemName}
                </h1>
                {typeof item.name === 'object' && item.name.ja && (
                  <p className="text-md text-gray-600 mb-2">{item.name.ja}</p>
                )}
                {item.cookingMethod && (
                  <p className="text-xs text-gray-500 ">{item.cookingMethod}</p>
                )}
              </div>
              <div className="text-right ml-6">
                <div className="text-md font-bold text-amber-600">₹{item.price}</div>
                {item.servingSize && (
                  <div className="text-xs text-gray-500">{item.servingSize}</div>
                )}
              </div>
            </div>

            {/* Short Description */}
            {/* {itemShortDescription && (
              <div className="mb-3">
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  {itemShortDescription}
                </p>
              </div>
            )} */}

            {/* Dietary & Special Indicators */}
            <div className="flex flex-wrap gap-3 mb-2">
              {item.vegetarian && (
                <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  <Leaf className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Vegetarian</span>
                </div>
              )}
              {item.vegan && (
                <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  <Leaf className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Vegan</span>
                </div>
              )}
              {item.glutenFree && (
                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">Gluten Free</span>
                </div>
              )}
              {item.spicy && (
                <div className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  <Flame className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">
                    Spicy {item.spicyLevel && `(${item.spicyLevel}/5)`}
                  </span>
                </div>
              )}
              {item.preparationTime > 0 && (
                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 md:px-3 md:py-1 rounded-full">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">{item.preparationTime} min</span>
                </div>
              )}  
            </div>

            {/* Full Description */}
            {itemDescription && (
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Full description</h3>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {itemDescription}
                </p>
              </div>
            )}

           {/* <div className="flex flex-row gap-4"> */}
            {/* Information Sections */}
            {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 md:gap-4 mb-2">
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2"> */}
              {/* Ingredients *
              {item.ingredients && item.ingredients.length > 0 && (
                <button
                  onClick={() => setShowIngredients(!showIngredients)}
                  className="bg-gray-50 hover:bg-gray-100 p-2 md:p-4 rounded-xl text-left transition-colors"
                >
                  <h4 className="text-sm font-semibold text-gray-900 mb-0">⚠️ Ingredients</h4>
                  <p className="text-xs text-gray-600">
                    {showIngredients 
                      ? item.ingredients.join(', ')
                      : `${item.ingredients.slice(0, 3).join(', ')}${item.ingredients.length > 3 ? '...' : ''}`
                    }
                  </p>
                  <p className="text-xs text-blue-600 mt-1 sm:hidden">
                    {showIngredients ? 'Show less' : 'Show all'}
                  </p>
                </button>
              )}

              {/* Nutrition *
              {item.nutritionalInfo && item.nutritionalInfo.calories > 0 && (
                <button
                  onClick={() => setShowNutrition(!showNutrition)}
                  className="bg-gray-50 hover:bg-gray-100 p-2  md:p-4 rounded-xl text-left transition-colors"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">Nutrition</h4>
                  {showNutrition ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Calories:</span>
                        <span>{item.nutritionalInfo.calories}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Protein:</span>
                        <span>{item.nutritionalInfo.protein}g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Carbs:</span>
                        <span>{item.nutritionalInfo.carbs}g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Fat:</span>
                        <span>{item.nutritionalInfo.fat}g</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {item.nutritionalInfo.calories} calories per serving
                    </p>
                  )}
                  <p className="text-xs text-blue-600 mt-2">
                    {showNutrition ? 'Show less' : 'Show details'}
                  </p>
                </button>
              )}

              {/* Allergens 
              {item.allergens && item.allergens.length > 0 && (
                <button
                  onClick={() => setShowAllergens(!showAllergens)}
                  className="bg-red-50 hover:bg-red-100 p-2  md:p-4 rounded-xl text-left transition-colors"
                >
                  <h4 className="text-sm font-semibold text-red-900 mb-0">⚠️ Contains</h4>
                  <p className="text-xs text-red-700">
                    {showAllergens 
                      ? (Array.isArray(item.allergens) ? item.allergens.join(', ') : item.allergens)
                      : `${Array.isArray(item.allergens) ? item.allergens.slice(0, 2).join(', ') : item.allergens}${Array.isArray(item.allergens) && item.allergens.length > 2 ? '...' : ''}`
                    }
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    {showAllergens ? 'Show less' : 'Show all'}
                  </p>
                </button>
              )}
            </div> */}

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 mb-4">
  {/* Ingredients */}
  {item.ingredients && item.ingredients.length > 0 && (
    <button
      onClick={() => setShowIngredients(!showIngredients)}
      className="bg-gray-50 hover:bg-gray-100 p-4 rounded-xl text-left transition-colors flex flex-col justify-between h-full"
    >
      <div>
        {/* <h4 className="text-sm font-semibold text-gray-900 mb-1">⚠️ Ingredients</h4> */}
        <h4 className="text-sm font-semibold text-gray-900 mb-1">Ingredients</h4>
        <p className="text-xs text-gray-600 flex flex-wrap break-words">
          {showIngredients 
            ? item.ingredients.join(', ')
            : `${item.ingredients.slice(0, 3).join(', ')}${item.ingredients.length > 3 ? '...' : ''}`}
        </p>
      </div>
      <p className="text-xs text-blue-600 mt-2">
        {showIngredients ? 'Show less' : 'Show all'}
      </p>
    </button>
  )}

  {/* Allergens / Contains */}
  {item.allergens && item.allergens.length > 0 && (
    <button
      onClick={() => setShowAllergens(!showAllergens)}
      className="bg-red-50 hover:bg-red-100 p-4 rounded-xl text-left transition-colors flex flex-col justify-between h-full"
    >
      <div>
        {/* <h4 className="text-sm font-semibold text-red-900 mb-1">⚠️ Contains</h4> */}
        <h4 className="text-sm font-semibold text-red-900 mb-1">Contains</h4>
        <p className="text-xs text-red-700 flex flex-wrap break-words">
          {showAllergens 
            ? (Array.isArray(item.allergens) ? item.allergens.join(', ') : item.allergens)
            : `${Array.isArray(item.allergens) ? item.allergens.slice(0, 2).join(', ') : item.allergens}${Array.isArray(item.allergens) && item.allergens.length > 2 ? '...' : ''}`}
        </p>
      </div>
      <p className="text-xs text-red-600 mt-2">
        {showAllergens ? 'Show less' : 'Show all'}
      </p>
    </button>
  )}

  {/* Nutrition */}
  {item.nutritionalInfo && item.nutritionalInfo.calories > 0 && (
    <button
      onClick={() => setShowNutrition(!showNutrition)}
      className="bg-gray-50 hover:bg-gray-100 p-4 rounded-xl text-left transition-colors flex flex-col justify-between h-full"
    >
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-1">Nutrition</h4>
        {showNutrition ? (
          // <div className="space-y-1 text-xs">
          <div className="flex  flex-wrap gap-y-1 text-xs">
                <div className="flex w-1/2 md:w-1/2 justify-between">
                  <span className="font-semibold">Calories:</span><span>{item.nutritionalInfo.calories}</span></div>
                <div className="flex w-1/2 md:w-1/2 justify-between">
                  <span className="font-semibold">Protein:</span><span>{item.nutritionalInfo.protein}g</span></div>
                <div className="flex w-1/2 md:w-1/2 justify-between">
                  <span className="font-semibold">Carbs:</span><span>{item.nutritionalInfo.carbs}g</span></div>
                <div className="flex w-1/2 md:w-1/2 justify-between">
                  <span className="font-semibold">Fat:</span><span>{item.nutritionalInfo.fat}g</span></div>
          </div>
        ) : (
          <p className="text-xs text-gray-600 flex flex-wrap">
            {item.nutritionalInfo.calories} calories per serving
          </p>
        )}
      </div>
      <p className="text-xs text-blue-600 mt-2">
        {showNutrition ? 'Show less' : 'Show details'}
      </p>
    </button>
  )}


</div>


            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-[10px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}        
          {/* </div> */}
        {/* Add to Cart Section */}
        {item.available && (
          // <div className="rounded-full shadow-xl px-5 md:p-8 sticky bottom-0 pb-4">
          // <div className="rounded-full shadow-xl px-5 py-1 bg-gray-100 md:p-8 sticky bottom-0 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
              <div className={`flex w-full items-center justify-${quantity == 0 ? 'center' : 'between'}`}>
                { quantity != 0 ? (
                <div className="flex items-center border border-gray-300 rounded-xl bg-gray-900">
                  <button
                    onClick={handleDecrease}
                    className="pl-4 py-2 text-white rounded-xl transition-colors"
                  >
                    -
                  </button>
                  <span className="px-0 py-2 font-semibold text-sm text-white min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  {/* <button
                    onClick={handleIncrease}
                    className="pr-4 py-2 text-white rounded-lg transition-colors"
                  >
                    +
                  </button> */}
                  <button
          onClick={(e) => {
            e.stopPropagation();
            // Only apply stock limit for retail items
            if (item.itemType === "retail") {
              const availableStock = item.currentStock ?? 0;
              if (quantity < availableStock) {
                handleIncrease();
              } else {
                showAlert(
                  "info",
                  "Stock Limit Reached",
                  `Only ${availableStock} unit(s) available for ${itemName}.`,
                  [{ text: "OK" }]
                );
              }
            } else {
              // Kitchen items → no limit
              handleIncrease();
            }
          }}
          className={`pr-4 py-2 rounded-xl transition-all duration-300 ${
            item.itemType === "retail" && quantity >= (item.currentStock ?? 0)
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
          disabled={item.itemType === "retail" && quantity >= (item.currentStock ?? 0)}
        >
          +
        </button>
                  
                </div>) : (
                   <button
                onClick={() => addToCart(item)}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-2 w-full rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Add
              </button>

                )}

                {/* <div className="text-xl font-bold text-gray-900">
                  Total: ₹{(item.price * quantity).toFixed(2)}
                </div> */}

                { quantity != 0 && (
                  <button
                  onClick={handleBack}
                  className="text-md font-semibold text-white bg-green-600 py-2 px-6 rounded-xl"
                >
                      Add: ₹ {(item.price * quantity).toFixed(2)}
                </button>
                )}



              </div>
              
              {/* <button
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                +
              </button> */}
            </div>
          // </div>
        )}
</div>
          </div>

        {/* Unavailable Message */}
        {!item.available && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <h3 className="text-xl font-semibold text-red-800 mb-2">Currently Unavailable</h3>
            <p className="text-red-600">This item is temporarily unavailable. Please check back later or choose another item.</p>
          </div>
        )}
      </div>
    </div>
  )
}