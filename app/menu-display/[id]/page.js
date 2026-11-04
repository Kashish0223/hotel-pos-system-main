"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Clock, Users, Star, ChefHat, Leaf, Flame, ShieldCheck } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useKeenSlider } from "keen-slider/react";
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import {useAuthToken} from "@/lib/useAuthToken";
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
    
    if (params.id) {
      fetchMenuItem()
    }
  }, [params.id])

  const fetchMenuItem = async () => {
    
          if (!token) return;
    try {
      const response = await fetch(`/api/menu/${params.id}`,{
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
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


  const handleBack = () => {
    router.push(`/menu-display`)
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
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
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
            className="flex items-center text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Menu
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden mb-8">
          {/* Image */}
          <div className="relative h-50 md:h-96">

          

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


            {/* Category Badge */}
            <div className="absolute bottom-4 left-4">
              <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                {item.category}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
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
                  <p className="text-sm text-gray-500 italic">{item.cookingMethod}</p>
                )}
              </div>
              <div className="text-right ml-6">
                <div className="text-lg font-bold text-amber-600">₹{item.price}</div>
                {item.servingSize && (
                  <div className="text-xs text-gray-500">{item.servingSize}</div>
                )}
              </div>
            </div>

            {/* Short Description */}
            {itemShortDescription && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  {itemShortDescription}
                </p>
              </div>
            )}

            {/* Dietary & Special Indicators */}
            <div className="flex flex-wrap gap-3 mb-1">
              {item.vegetarian && (
                <div className="flex items-center bg-green-100 text-green-800 px-3 py-2 rounded-full">
                  <Leaf className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Vegetarian</span>
                </div>
              )}
              {item.vegan && (
                <div className="flex items-center bg-green-100 text-green-800 px-3 py-2 rounded-full">
                  <Leaf className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Vegan</span>
                </div>
              )}
              {item.glutenFree && (
                <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-full">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Gluten Free</span>
                </div>
              )}
              {item.spicy && (
                <div className="flex items-center bg-red-100 text-red-800 px-3 py-2 rounded-full">
                  <Flame className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    Spicy {item.spicyLevel && `(${item.spicyLevel}/5)`}
                  </span>
                </div>
              )}
              {item.preparationTime > 0 && (
                <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-full">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">{item.preparationTime} min</span>
                </div>
              )}
            </div>

            {/* Full Description */}
            {itemDescription && (
              <div className="mb-5">
                <h3 className="text-md font-semibold text-gray-900">Full description</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {itemDescription}
                </p>
              </div>
            )}

            {/* Information Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Ingredients */}
              {item.ingredients && item.ingredients.length > 0 && (
                <button
                  onClick={() => setShowIngredients(!showIngredients)}
                  className="bg-gray-50 hover:bg-gray-100 p-4 rounded-xl text-left transition-colors"
                >
                  <h4 className="font-semibold text-gray-900 mb-0">Ingredients</h4>
                  <p className="text-sm text-gray-600">
                    {showIngredients 
                      ? item.ingredients.join(', ')
                      : `${item.ingredients.slice(0, 3).join(', ')}${item.ingredients.length > 3 ? '...' : ''}`
                    }
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {showIngredients ? 'Show less' : 'Show all'}
                  </p>
                </button>
              )}

              {/* Nutrition */}
              {item.nutritionalInfo && item.nutritionalInfo.calories > 0 && (
                <button
                  onClick={() => setShowNutrition(!showNutrition)}
                  className="bg-gray-50 hover:bg-gray-100 p-4 rounded-xl text-left transition-colors"
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

              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <button
                  onClick={() => setShowAllergens(!showAllergens)}
                  className="bg-red-50 hover:bg-red-100 p-4 rounded-xl text-left transition-colors"
                >
                  <h4 className="font-semibold text-red-900 mb-2">⚠️ Contains</h4>
                  <p className="text-sm text-red-700">
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
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

     
      </div>
    </div>
  )
}