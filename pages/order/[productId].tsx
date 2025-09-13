import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../lib/firebase"

export default function ProductDetail() {
  const router = useRouter()
  const { productId } = router.query
  const [product, setProduct] = useState<any>(null)

  useEffect(() => {
    if (!productId) return
    const fetchProduct = async () => {
      const snap = await getDoc(doc(db, "products", productId as string))
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() })
    }
    fetchProduct()
  }, [productId])

  if (!product) return <p className="p-6">Loading...</p>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* 이미지 영역 */}
      <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden shadow">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* 제품 정보 */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-xl text-pink-600 font-semibold">
          ₩ {product.price?.toLocaleString()}
        </p>
        {product.description && (
          <p className="text-gray-600 whitespace-pre-line">
            {product.description}
          </p>
        )}
      </div>
    </div>
  )
}