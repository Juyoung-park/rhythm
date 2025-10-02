import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/router";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, addDoc, where, serverTimestamp, deleteField, onSnapshot } from "firebase/firestore";
import { handleLogout } from "../lib/auth";
import Link from "next/link";
import dynamic from "next/dynamic";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  imageUrl?: string;
  sizes?: string[];
  colors?: string[];
  createdAt: any;
  updatedAt?: any;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  organization?: string; // 소속
  address?: string; // 주소
  carNumber?: string; // 차량번호
  size?: string; // 사이즈
  shoulderWidth?: number; // 어깨너비
  waistCircumference?: number; // 허리둘레
  bustCircumference?: number; // 가슴둘레
  hipCircumference?: number; // 엉덩이둘레
  sleeveLength?: number; // 소매길이
  thighCircumference?: number; // 허벌지둘레
  topLength?: number; // 상의길이
  crotchLength?: number; // 밑위길이
  skirtLength?: number; // 치마길이
  pantsLength?: number; // 바지길이
  email: string;
  createdAt: any;
  updatedAt: any;
}

interface Consultation {
  id: string;
  name: string;
  email: string;
  phone: string;
  teamName?: string;
  consultationType: string;
  preferredDate?: string;
  preferredTime?: string;
  message: string;
  budget?: string;
  performanceDate?: string;
  userId?: string;
  userEmail?: string;
  status: string;
  createdAt: any;
  updatedAt: any;
}

interface Order {
  id: string;
  customerId: string;
  productId: string;
  customerName: string;
  customerEmail?: string;
  productName: string;
  productPrice?: number;
  productImageUrl?: string;
  selectedSize?: string;
  selectedColor?: string;
  quantity?: number;
  status: string;
  deliveryAddress?: string;
  phoneNumber?: string;
  specialRequests?: string;
  createdAt: any;
  updatedAt?: any;
}

// Force client-side rendering
const AdminPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [showCustomerOrders, setShowCustomerOrders] = useState(false);
  
  // 이미지 확대 모달 상태
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [selectedImageAlt, setSelectedImageAlt] = useState("");
  
  // 제품 수정 상태
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    sizes: [] as string[],
    colors: [] as string[]
  });

  // 주문 추가 상태
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerEmail: "",
    productId: "",
    selectedSize: "",
    selectedColor: "",
    quantity: 1,
    deliveryAddress: "",
    phoneNumber: "",
    specialRequests: ""
  });
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    organization: "",
    address: "",
    carNumber: "",
    size: "",
    shoulderWidth: "",
    waistCircumference: "",
    bustCircumference: "",
    hipCircumference: "",
    sleeveLength: "",
    thighCircumference: "",
    topLength: "",
    crotchLength: "",
    skirtLength: "",
    pantsLength: "",
    email: ""
  });

  // Wait for router to be ready
  if (!router.isReady) {
    return <div className="p-4">로딩 중...</div>;
  }

  useEffect(() => {
    if (user === undefined) return;
    
    if (!user || user.email !== "admin@rhythm.com") {
      router.push("/login");
      return;
    }

    // Set up real-time listeners
    const cleanup = fetchData();
    
    // Cleanup function to unsubscribe from listeners
    return cleanup;
  }, [user, router]);

  const fetchOrders = async () => {
    try {
      const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchData = () => {
    try {
      // Set up real-time listeners for products
      const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
        console.log("제품 데이터 실시간 업데이트:", productsData.length + "개");
      });

      // Set up real-time listeners for customers (users)
      const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const customersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Customer[];
        setCustomers(customersData);
        console.log("고객 데이터 실시간 업데이트:", customersData.length + "명");
      });

      // Set up real-time listeners for orders
      const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(ordersData);
        console.log("주문 데이터 실시간 업데이트:", ordersData.length + "개");
      });

      // Set up real-time listeners for consultations
      const consultationsQuery = query(collection(db, "consultations"), orderBy("createdAt", "desc"));
      const unsubscribeConsultations = onSnapshot(consultationsQuery, (snapshot) => {
        const consultationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Consultation[];
        setConsultations(consultationsData);
        console.log("상담 문의 데이터 실시간 업데이트:", consultationsData.length + "개");
      });

      // Store unsubscribe functions for cleanup
      return () => {
        unsubscribeProducts();
        unsubscribeUsers();
        unsubscribeOrders();
        unsubscribeConsultations();
      };
    } catch (error) {
      console.error("Error setting up real-time listeners:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async (customer: Customer) => {
    try {
      console.log("=== FETCHING CUSTOMER ORDERS ===");
      console.log("Customer info:", {
        id: customer.id,
        name: customer.name,
        email: customer.email
      });
      
      // 모든 주문과 제품을 가져와서 클라이언트에서 필터링
      const [ordersSnapshot, productsSnapshot] = await Promise.all([
        getDocs(collection(db, "orders")),
        getDocs(collection(db, "products"))
      ]);
      
      // 제품 정보를 Map으로 변환하여 빠른 조회 가능
      const productsMap = new Map();
      productsSnapshot.docs.forEach(doc => {
        productsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
      
      const allOrders = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        const productInfo = productsMap.get(data.productId);
        
        console.log("Order data:", {
          id: doc.id,
          productId: data.productId,
          customerId: data.customerId,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          originalProductName: data.productName,
          latestProductName: productInfo?.name,
          productInfo: productInfo,
          productImageUrl: productInfo?.imageUrl,
          hasProductImage: !!productInfo?.imageUrl
        });
        
        return {
          id: doc.id,
          ...data,
          // 제품 정보가 있으면 최신 정보 사용, 없으면 주문에 저장된 정보 사용
          productName: productInfo?.name || data.productName || "제품 정보 없음",
          productImageUrl: productInfo?.imageUrl || "",
          productPrice: productInfo?.price || data.productPrice
        };
      }) as Order[];
      
      console.log("Total orders in database:", allOrders.length);
      
      // 고객과 관련된 주문들 필터링
      const customerOrders = allOrders.filter(order => {
        console.log("Checking order:", {
          orderId: order.id,
          orderCustomerId: order.customerId,
          orderCustomerEmail: order.customerEmail,
          orderCustomerName: order.customerName,
          customerId: customer.id,
          customerEmail: customer.email,
          customerName: customer.name
        });
        
        // customerId로 매칭 (Firestore 문서 ID 또는 Firebase Auth UID)
        if (order.customerId === customer.id) {
          console.log("✅ Matched by customerId");
          return true;
        }
        
        // customerEmail로 매칭
        if (order.customerEmail && order.customerEmail === customer.email) {
          console.log("✅ Matched by customerEmail");
          return true;
        }
        
        // customerName으로 매칭
        if (order.customerName && (order.customerName === customer.name || order.customerName === customer.email)) {
          console.log("✅ Matched by customerName");
          return true;
        }
        
        console.log("❌ No match found");
        return false;
      });
      
      console.log("=== FILTERING RESULTS ===");
      console.log("All orders:", allOrders.length);
      console.log("Customer orders found:", customerOrders.length);
      console.log("Customer orders data:", customerOrders);
      
      setCustomerOrders(customerOrders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      setCustomerOrders([]);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("정말로 이 제품을 삭제하시겠습니까?")) return;
    
    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts(products.filter(p => p.id !== productId));
      alert("제품이 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category || "",
      sizes: product.sizes || [],
      colors: product.colors || []
    });
  };

  // 상담 문의 상태 업데이트
  const updateConsultationStatus = async (consultationId: string, status: string) => {
    try {
      const consultationRef = doc(db, "consultations", consultationId);
      await updateDoc(consultationRef, {
        status,
        updatedAt: serverTimestamp()
      });
      alert(`상담 문의 상태가 '${status}'로 변경되었습니다.`);
    } catch (error) {
      console.error("Error updating consultation status:", error);
      alert("상담 문의 상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 제품 정보가 변경될 때 관련 주문들의 제품 정보도 업데이트
  const updateOrdersWithProductInfo = async (productId: string, productInfo: { productName: string, productImageUrl?: string, productPrice?: number }) => {
    try {
      console.log(`Updating orders for product ${productId} with info:`, productInfo);
      
      // 해당 제품과 관련된 모든 주문 찾기
      const ordersQuery = query(
        collection(db, "orders"),
        where("productId", "==", productId)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      // 각 주문의 제품 정보 업데이트
      const updatePromises = ordersSnapshot.docs.map(async (orderDoc) => {
        const orderData = orderDoc.data();
        const updateData: any = {
          productName: productInfo.productName,
          updatedAt: serverTimestamp()
        };
        
        // 이미지 URL이 변경된 경우에만 업데이트
        if (productInfo.productImageUrl !== undefined) {
          updateData.productImageUrl = productInfo.productImageUrl;
        }
        
        // 제품 가격이 변경된 경우에만 업데이트
        if (productInfo.productPrice !== undefined) {
          updateData.productPrice = productInfo.productPrice;
        }
        
        console.log(`Updating order ${orderDoc.id} with:`, updateData);
        return updateDoc(doc(db, "orders", orderDoc.id), updateData);
      });
      
      await Promise.all(updatePromises);
      console.log(`Updated ${ordersSnapshot.docs.length} orders for product ${productId}`);
      
      // 로컬 주문 상태도 업데이트
      setOrders(orders.map(order => 
        order.productId === productId 
          ? { ...order, ...productInfo }
          : order
      ));
      
    } catch (error) {
      console.error("Error updating orders with product info:", error);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    try {
      const productRef = doc(db, "products", editingProduct.id);
      
      // 모든 값을 명시적으로 검증하고 undefined 제거
      const updateData: any = {};
      
      // 필수 필드들 (항상 포함)
      if (editProductForm.name && editProductForm.name.trim() !== "") {
        updateData.name = editProductForm.name.trim();
      }
      
      if (editProductForm.description && editProductForm.description.trim() !== "") {
        updateData.description = editProductForm.description.trim();
      }
      
      if (editProductForm.price && !isNaN(parseFloat(editProductForm.price))) {
        updateData.price = parseFloat(editProductForm.price);
      }
      
      // 선택적 필드들 (값이 있을 때만 포함)
      if (editProductForm.category && editProductForm.category.trim() !== "") {
        updateData.category = editProductForm.category.trim();
      }
      
      if (editProductForm.sizes && Array.isArray(editProductForm.sizes) && editProductForm.sizes.length > 0) {
        updateData.sizes = editProductForm.sizes;
      }
      
      if (editProductForm.colors && Array.isArray(editProductForm.colors) && editProductForm.colors.length > 0) {
        updateData.colors = editProductForm.colors;
      }
      
      // 항상 포함할 필드
      updateData.updatedAt = new Date();
      
      console.log("Updating product with data:", updateData);
      console.log("Original form data:", editProductForm);
      
      // 최소한의 필수 데이터가 있는지 확인
      if (!updateData.name || !updateData.description || updateData.price === undefined) {
        throw new Error("필수 필드가 누락되었습니다.");
      }
      
      // 안전한 업데이트를 위해 기존 데이터와 병합
      const finalUpdateData: any = {
        ...editingProduct,
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      // undefined 값들을 제거
      Object.keys(finalUpdateData).forEach(key => {
        if (finalUpdateData[key] === undefined || finalUpdateData[key] === null) {
          delete finalUpdateData[key];
        }
      });
      
      console.log("Final update data:", finalUpdateData);
      await updateDoc(productRef, finalUpdateData);
      
      // 해당 제품과 관련된 모든 주문의 제품 정보 업데이트
      await updateOrdersWithProductInfo(editingProduct.id, {
        productName: finalUpdateData.name,
        productImageUrl: finalUpdateData.imageUrl,
        productPrice: finalUpdateData.price
      });
      
      // 로컬 상태 업데이트
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...p, ...editProductForm, price: parseFloat(editProductForm.price) }
          : p
      ));
      
      setEditingProduct(null);
      setEditProductForm({ name: "", description: "", price: "", category: "", sizes: [], colors: [] });
      alert("제품이 수정되었습니다.");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("제품 수정 중 오류가 발생했습니다.");
    }
  };

  const handleAddOrder = async () => {
    if (!newOrder.customerEmail || !newOrder.productId || !newOrder.selectedSize || !newOrder.selectedColor) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    try {
      const selectedProduct = products.find(p => p.id === newOrder.productId);
      if (!selectedProduct) {
        alert("선택된 제품을 찾을 수 없습니다.");
        return;
      }

      // 고객 정보 가져오기
      const customersQuery = query(collection(db, "users"), where("email", "==", newOrder.customerEmail));
      const customersSnapshot = await getDocs(customersQuery);
      
      let customerId = "";
      let customerName = "";
      
      if (customersSnapshot.empty) {
        alert("해당 이메일의 고객을 찾을 수 없습니다. 고객이 먼저 회원가입을 해야 합니다.");
        return;
      } else {
        const customerData = customersSnapshot.docs[0].data();
        customerId = customersSnapshot.docs[0].id;
        customerName = customerData.name || newOrder.customerEmail;
      }

      await addDoc(collection(db, "orders"), {
        customerId: customerId,
        productId: newOrder.productId,
        customerName: customerName,
        customerEmail: newOrder.customerEmail,
        productName: selectedProduct.name,
        selectedSize: newOrder.selectedSize,
        selectedColor: newOrder.selectedColor,
        quantity: newOrder.quantity,
        status: "pending",
        deliveryAddress: newOrder.deliveryAddress,
        phoneNumber: newOrder.phoneNumber,
        specialRequests: newOrder.specialRequests,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 폼 초기화
      setNewOrder({
        customerEmail: "",
        productId: "",
        selectedSize: "",
        selectedColor: "",
        quantity: 1,
        deliveryAddress: "",
        phoneNumber: "",
        specialRequests: ""
      });
      setShowAddOrder(false);
      
      // 주문 목록 새로고침
      fetchOrders();
      
      alert("주문이 성공적으로 추가되었습니다.");
    } catch (error) {
      console.error("Error adding order:", error);
      alert("주문 추가 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      alert("주문 상태가 업데이트되었습니다.");
    } catch (error) {
      console.error("Error updating order:", error);
      alert("업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || "",
      phone: customer.phone || "",
      organization: customer.organization || "",
      address: customer.address || "",
      carNumber: customer.carNumber || "",
      size: customer.size || "",
      shoulderWidth: customer.shoulderWidth?.toString() || "",
      waistCircumference: customer.waistCircumference?.toString() || "",
      bustCircumference: customer.bustCircumference?.toString() || "",
      hipCircumference: customer.hipCircumference?.toString() || "",
      sleeveLength: customer.sleeveLength?.toString() || "",
      thighCircumference: customer.thighCircumference?.toString() || "",
      topLength: customer.topLength?.toString() || "",
      crotchLength: customer.crotchLength?.toString() || "",
      skirtLength: customer.skirtLength?.toString() || "",
      pantsLength: customer.pantsLength?.toString() || "",
      email: customer.email || ""
    });
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;

    try {
      const updateData: any = {
        name: editForm.name,
        phone: editForm.phone,
        organization: editForm.organization,
        address: editForm.address,
        carNumber: editForm.carNumber,
        size: editForm.size,
        email: editForm.email,
        updatedAt: new Date()
      };

      // 숫자 필드들은 값이 있을 때만 추가 (안전한 처리)
      const numericFields = [
        'shoulderWidth',
        'waistCircumference', 
        'bustCircumference',
        'hipCircumference',
        'sleeveLength',
        'thighCircumference',
        'topLength',
        'crotchLength',
        'skirtLength',
        'pantsLength'
      ];

      numericFields.forEach(field => {
        const value = editForm[field as keyof typeof editForm];
        if (value && typeof value === 'string' && value.trim()) {
          const numValue = Number(value.trim());
          if (!isNaN(numValue)) {
            updateData[field] = numValue;
          }
        }
      });

      await updateDoc(doc(db, "users", editingCustomer.id), updateData);

      // 실시간 업데이트가 자동으로 처리되므로 수동 업데이트 제거
      setEditingCustomer(null);
      alert("고객 정보가 업데이트되었습니다.");
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("정말로 이 고객을 삭제하시겠습니까?\n\n⚠️ 주의: 이 작업은 되돌릴 수 없습니다.\n- Firestore의 고객 정보만 삭제됩니다\n- Firebase Authentication 계정은 별도로 관리됩니다")) return;
    
    try {
      await deleteDoc(doc(db, "users", customerId));
      // 실시간 업데이트가 자동으로 처리되므로 수동 업데이트 제거
      alert("고객 정보가 삭제되었습니다.\n\n참고: Firebase Authentication 계정이 별도로 존재할 수 있습니다.");
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleAddCustomer = async () => {
    // 필수 필드 검증
    if (!editForm.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (!editForm.phone.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    try {
      console.log("=== 고객 추가 시작 ===");
      console.log("입력된 폼 데이터:", editForm);
      
      const newCustomerData: any = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || "",
        organization: editForm.organization.trim() || "",
        address: editForm.address.trim() || "",
        carNumber: editForm.carNumber.trim() || "",
        size: editForm.size.trim() || "",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 숫자 필드들은 값이 있을 때만 추가 (안전한 처리)
      const numericFields = [
        'shoulderWidth',
        'waistCircumference', 
        'bustCircumference',
        'hipCircumference',
        'sleeveLength',
        'thighCircumference',
        'topLength',
        'crotchLength',
        'skirtLength',
        'pantsLength'
      ];

      numericFields.forEach(field => {
        const value = editForm[field as keyof typeof editForm];
        if (value && typeof value === 'string' && value.trim()) {
          const numValue = Number(value.trim());
          if (!isNaN(numValue)) {
            newCustomerData[field] = numValue;
          }
        }
      });

      console.log("처리된 고객 데이터:", newCustomerData);
      console.log("Firestore DB 객체:", db);
      
      const docRef = await addDoc(collection(db, "users"), newCustomerData);
      console.log("Firestore 문서 참조:", docRef);
      
      const newCustomer: Customer = {
        id: docRef.id,
        ...newCustomerData
      };

      console.log("새 고객 객체:", newCustomer);
      
      // 실시간 업데이트가 자동으로 처리되므로 수동 업데이트 제거
      setShowAddCustomer(false);
      resetForm();
      alert("고객이 성공적으로 추가되었습니다.");
      console.log("=== 고객 추가 완료 ===");
    } catch (error) {
      console.error("=== 고객 추가 에러 ===");
      console.error("에러 타입:", typeof error);
      console.error("에러 객체:", error);
      console.error("에러 메시지:", error instanceof Error ? error.message : String(error));
      console.error("에러 코드:", (error as any)?.code);
      console.error("에러 스택:", error instanceof Error ? error.stack : "No stack trace");
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`고객 추가 중 오류가 발생했습니다.\n\n오류: ${errorMessage}\n\n개발자 도구 콘솔을 확인해주세요.`);
    }
  };

  const resetForm = () => {
    setEditForm({
      name: "",
      phone: "",
      organization: "",
      address: "",
      carNumber: "",
      size: "",
      shoulderWidth: "",
      waistCircumference: "",
      bustCircumference: "",
      hipCircumference: "",
      sleeveLength: "",
      thighCircumference: "",
      topLength: "",
      crotchLength: "",
      skirtLength: "",
      pantsLength: "",
      email: ""
    });
  };

  const handleViewCustomerOrders = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerOrders(true);
    // 최신 제품 정보와 함께 주문내역 가져오기
    await fetchCustomerOrders(customer);
  };

  const closeCustomerOrders = () => {
    setSelectedCustomer(null);
    setShowCustomerOrders(false);
    setCustomerOrders([]);
  };

  const handleImageClick = (imageUrl: string, imageAlt: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageAlt(imageAlt);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImageUrl("");
    setSelectedImageAlt("");
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showImageModal) {
          closeImageModal();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showImageModal]);

  const cancelEdit = () => {
    setEditingCustomer(null);
    setShowAddCustomer(false);
    resetForm();
  };

  // 고객 검색 필터링
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.organization && customer.organization.toLowerCase().includes(searchLower)) ||
      (customer.address && customer.address.toLowerCase().includes(searchLower)) ||
      (customer.carNumber && customer.carNumber.toLowerCase().includes(searchLower)) ||
      (customer.size && customer.size.toLowerCase().includes(searchLower))
    );
  });

  if (user === undefined) {
    return <div className="p-4">로딩 중...</div>;
  }

  if (!user || user.email !== "admin@rhythm.com") {
    return <div className="p-4">관리자 권한이 필요합니다.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/products" className="text-2xl font-bold text-purple-600">Rhythm</Link>
              <span className="ml-2 text-gray-600">관리자</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/products" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  router.pathname === "/products" ? "text-purple-600 font-semibold" : "text-gray-700 hover:text-purple-600"
                }`}
              >
                홈으로
              </Link>
              <Link 
                href="/products" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  router.pathname === "/products" ? "text-purple-600 font-semibold" : "text-gray-700 hover:text-purple-600"
                }`}
              >
                제품보기
              </Link>
              <button
                onClick={() => handleLogout(router)}
                className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">관리자 패널</h1>
          <p className="text-gray-600">제품, 고객, 주문을 관리하세요</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-white rounded-lg shadow p-1">
            {[
              { id: "products", name: "제품 관리", count: products.length },
              { id: "customers", name: "고객 관리", count: customers.length },
              { id: "orders", name: "주문 관리", count: orders.length },
              { id: "consultations", name: "상담 문의", count: consultations.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "text-gray-700 hover:text-purple-600"
                }`}
              >
                {tab.name} ({tab.count})
              </button>
            ))}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-4">
            <Link
              href="/admin/add-product"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              새 제품 추가
            </Link>
            <Link
              href="/admin/orders"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              주문 상세 관리
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === "products" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">제품 관리</h2>
                <div className="flex space-x-2">
                  <Link
                    href="/admin/add-test-product"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    테스트 제품 추가
                  </Link>
                  <Link
                    href="/admin/add-product"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    새 제품 추가
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제품명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₩{product.price.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "customers" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">고객 관리</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowAddCustomer(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    고객 추가
                  </button>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="고객 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    총 {customers.length}명 | 검색 결과 {filteredCustomers.length}명
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto max-w-full">
                <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1000px' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">소속</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">차량번호</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : "등록된 고객이 없습니다."}
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name || "-"}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 max-w-32 truncate">{customer.email || "-"}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{customer.phone || "-"}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 max-w-24 truncate">{customer.organization || "-"}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{customer.carNumber || "-"}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {customer.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className="text-blue-600 hover:text-blue-900 text-xs"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleViewCustomerOrders(customer)}
                              className="text-green-600 hover:text-green-900 text-xs"
                            >
                              주문내역
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">주문 관리</h2>
                <button
                  onClick={() => setShowAddOrder(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  주문 추가
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제품명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.productName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            order.status === "processing" ? "bg-blue-100 text-blue-800" :
                            order.status === "completed" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {order.status === "pending" ? "대기중" :
                             order.status === "processing" ? "제작중" :
                             order.status === "completed" ? "완료" : order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="pending">대기중</option>
                            <option value="processing">제작중</option>
                            <option value="completed">완료</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "consultations" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">상담 문의 관리</h2>
                <div className="text-sm text-gray-500">
                  총 {consultations.length}건의 문의
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상담유형</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">문의일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consultations.map((consultation) => (
                      <tr key={consultation.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {consultation.name}
                          {consultation.teamName && (
                            <div className="text-xs text-gray-500">({consultation.teamName})</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{consultation.phone}</div>
                          <div className="text-xs text-gray-500">{consultation.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {consultation.consultationType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            consultation.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            consultation.status === "contacted" ? "bg-blue-100 text-blue-800" :
                            consultation.status === "in_progress" ? "bg-purple-100 text-purple-800" :
                            consultation.status === "completed" ? "bg-green-100 text-green-800" :
                            consultation.status === "cancelled" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {consultation.status === "pending" ? "대기중" :
                             consultation.status === "contacted" ? "연락완료" :
                             consultation.status === "in_progress" ? "상담중" :
                             consultation.status === "completed" ? "완료" :
                             consultation.status === "cancelled" ? "취소" : consultation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {consultation.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <select
                            value={consultation.status}
                            onChange={(e) => updateConsultationStatus(consultation.id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="pending">대기중</option>
                            <option value="contacted">연락완료</option>
                            <option value="in_progress">상담중</option>
                            <option value="completed">완료</option>
                            <option value="cancelled">취소</option>
                          </select>
                          <button
                            onClick={() => {
                              alert(`문의 내용:\n\n${consultation.message}\n\n예산: ${consultation.budget || "미지정"}\n공연일: ${consultation.performanceDate || "미지정"}\n선호 날짜: ${consultation.preferredDate || "미지정"}`);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            내용보기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {consultations.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    아직 상담 문의가 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 고객 수정 모달 */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">고객 정보 수정</h3>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">기본 정보</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
                    <input
                      type="text"
                      value={editForm.organization}
                      onChange={(e) => setEditForm({...editForm, organization: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">차량번호</label>
                    <input
                      type="text"
                      value={editForm.carNumber}
                      onChange={(e) => setEditForm({...editForm, carNumber: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사이즈</label>
                    <input
                      type="text"
                      value={editForm.size}
                      onChange={(e) => setEditForm({...editForm, size: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* 신체 치수 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">신체 치수 (cm)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">어깨너비</label>
                      <input
                        type="number"
                        value={editForm.shoulderWidth}
                        onChange={(e) => setEditForm({...editForm, shoulderWidth: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">허리둘레</label>
                      <input
                        type="number"
                        value={editForm.waistCircumference}
                        onChange={(e) => setEditForm({...editForm, waistCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">가슴둘레</label>
                      <input
                        type="number"
                        value={editForm.bustCircumference}
                        onChange={(e) => setEditForm({...editForm, bustCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">엉덩이둘레</label>
                      <input
                        type="number"
                        value={editForm.hipCircumference}
                        onChange={(e) => setEditForm({...editForm, hipCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">소매길이</label>
                      <input
                        type="number"
                        value={editForm.sleeveLength}
                        onChange={(e) => setEditForm({...editForm, sleeveLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">허벌지둘레</label>
                      <input
                        type="number"
                        value={editForm.thighCircumference}
                        onChange={(e) => setEditForm({...editForm, thighCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">상의길이</label>
                      <input
                        type="number"
                        value={editForm.topLength}
                        onChange={(e) => setEditForm({...editForm, topLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">밑위길이</label>
                      <input
                        type="number"
                        value={editForm.crotchLength}
                        onChange={(e) => setEditForm({...editForm, crotchLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">치마길이</label>
                      <input
                        type="number"
                        value={editForm.skirtLength}
                        onChange={(e) => setEditForm({...editForm, skirtLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">바지길이</label>
                      <input
                        type="number"
                        value={editForm.pantsLength}
                        onChange={(e) => setEditForm({...editForm, pantsLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateCustomer}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 고객 추가 모달 */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold">새 고객 추가</h3>
              <p className="text-sm text-gray-600 mt-1">* 표시된 필드는 필수 입력 항목입니다. 이름과 연락처만 필수입니다.</p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">기본 정보</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일 <span className="text-gray-400 text-xs">(선택사항)</span></label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">소속 <span className="text-gray-400 text-xs">(선택사항)</span></label>
                    <input
                      type="text"
                      value={editForm.organization}
                      onChange={(e) => setEditForm({...editForm, organization: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주소 <span className="text-gray-400 text-xs">(선택사항)</span></label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">차량번호 <span className="text-gray-400 text-xs">(선택사항)</span></label>
                    <input
                      type="text"
                      value={editForm.carNumber}
                      onChange={(e) => setEditForm({...editForm, carNumber: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사이즈</label>
                    <input
                      type="text"
                      value={editForm.size}
                      onChange={(e) => setEditForm({...editForm, size: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* 신체 치수 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">신체 치수 (cm)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">어깨너비</label>
                      <input
                        type="number"
                        value={editForm.shoulderWidth}
                        onChange={(e) => setEditForm({...editForm, shoulderWidth: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">허리둘레</label>
                      <input
                        type="number"
                        value={editForm.waistCircumference}
                        onChange={(e) => setEditForm({...editForm, waistCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">가슴둘레</label>
                      <input
                        type="number"
                        value={editForm.bustCircumference}
                        onChange={(e) => setEditForm({...editForm, bustCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">엉덩이둘레</label>
                      <input
                        type="number"
                        value={editForm.hipCircumference}
                        onChange={(e) => setEditForm({...editForm, hipCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">소매길이</label>
                      <input
                        type="number"
                        value={editForm.sleeveLength}
                        onChange={(e) => setEditForm({...editForm, sleeveLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">허벌지둘레</label>
                      <input
                        type="number"
                        value={editForm.thighCircumference}
                        onChange={(e) => setEditForm({...editForm, thighCircumference: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">상의길이</label>
                      <input
                        type="number"
                        value={editForm.topLength}
                        onChange={(e) => setEditForm({...editForm, topLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">밑위길이</label>
                      <input
                        type="number"
                        value={editForm.crotchLength}
                        onChange={(e) => setEditForm({...editForm, crotchLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">치마길이</label>
                      <input
                        type="number"
                        value={editForm.skirtLength}
                        onChange={(e) => setEditForm({...editForm, skirtLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">바지길이</label>
                      <input
                        type="number"
                        value={editForm.pantsLength}
                        onChange={(e) => setEditForm({...editForm, pantsLength: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddCustomer}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                고객 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 주문 추가 모달 */}
      {showAddOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">새 주문 추가</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">고객 이메일 *</label>
                <input
                  type="email"
                  value={newOrder.customerEmail}
                  onChange={(e) => setNewOrder({...newOrder, customerEmail: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="고객의 이메일을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제품 선택 *</label>
                <select
                  value={newOrder.productId}
                  onChange={(e) => {
                    const selectedProduct = products.find(p => p.id === e.target.value);
                    setNewOrder({
                      ...newOrder, 
                      productId: e.target.value,
                      selectedSize: "",
                      selectedColor: ""
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">제품을 선택하세요</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ₩{product.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              
              {newOrder.productId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">사이즈 *</label>
                    <select
                      value={newOrder.selectedSize}
                      onChange={(e) => setNewOrder({...newOrder, selectedSize: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">사이즈를 선택하세요</option>
                      {products.find(p => p.id === newOrder.productId)?.sizes?.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">색상 *</label>
                    <select
                      value={newOrder.selectedColor}
                      onChange={(e) => setNewOrder({...newOrder, selectedColor: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">색상을 선택하세요</option>
                      {products.find(p => p.id === newOrder.productId)?.colors?.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">수량 *</label>
                <input
                  type="number"
                  min="1"
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder({...newOrder, quantity: parseInt(e.target.value) || 1})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">배송지</label>
                <input
                  type="text"
                  value={newOrder.deliveryAddress}
                  onChange={(e) => setNewOrder({...newOrder, deliveryAddress: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="배송지를 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                <input
                  type="tel"
                  value={newOrder.phoneNumber}
                  onChange={(e) => setNewOrder({...newOrder, phoneNumber: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="연락처를 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">특별 요청사항</label>
                <textarea
                  value={newOrder.specialRequests}
                  onChange={(e) => setNewOrder({...newOrder, specialRequests: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="특별 요청사항이 있다면 입력하세요"
                />
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddOrder(false);
                  setNewOrder({
                    customerEmail: "",
                    productId: "",
                    selectedSize: "",
                    selectedColor: "",
                    quantity: 1,
                    deliveryAddress: "",
                    phoneNumber: "",
                    specialRequests: ""
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddOrder}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                주문 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 제품 수정 모달 */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">제품 수정</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제품명</label>
                <input
                  type="text"
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({...editProductForm, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="제품명을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <textarea
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm({...editProductForm, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="제품 설명을 입력하세요"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">가격</label>
                  <input
                    type="number"
                    value={editProductForm.price}
                    onChange={(e) => setEditProductForm({...editProductForm, price: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="가격을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={editProductForm.category}
                    onChange={(e) => setEditProductForm({...editProductForm, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">카테고리 선택</option>
                    <option value="dress">드레스</option>
                    <option value="top">상의</option>
                    <option value="bottom">하의</option>
                    <option value="accessory">액세서리</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">사이즈 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={editProductForm.sizes.join(", ")}
                  onChange={(e) => setEditProductForm({...editProductForm, sizes: e.target.value.split(",").map(s => s.trim()).filter(s => s)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="예: S, M, L, XL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">색상 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={editProductForm.colors.join(", ")}
                  onChange={(e) => setEditProductForm({...editProductForm, colors: e.target.value.split(",").map(s => s.trim()).filter(s => s)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="예: 빨강, 파랑, 검정, 흰색"
                />
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateProduct}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                수정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원별 주문 히스토리 모달 */}
      {showCustomerOrders && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* 헤더 */}
            <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedCustomer.name || selectedCustomer.email}의 주문 내역
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    총 {customerOrders.length}건의 주문
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectedCustomer && fetchCustomerOrders(selectedCustomer)}
                    className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                    title="새로고침"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={closeCustomerOrders}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 디버깅 정보 */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <strong>디버깅 정보:</strong>
                <br />고객 ID: {selectedCustomer?.id}
                <br />고객 이메일: {selectedCustomer?.email}
                <br />고객 이름: {selectedCustomer?.name}
                <br />찾은 주문 수: {customerOrders.length}
              </div>
              
              {customerOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">주문 내역이 없습니다</h3>
                  <p className="text-gray-600">이 고객은 아직 주문을 하지 않았습니다.</p>
                  <p className="text-xs text-gray-500 mt-2">브라우저 개발자 도구 콘솔에서 디버깅 정보를 확인하세요.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                      <div className="flex items-start gap-4 mb-4">
                        {/* 제품 이미지 */}
                        <div className="flex-shrink-0">
                          {order.productImageUrl ? (
                            <img
                              src={order.productImageUrl}
                              alt={order.productName}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleImageClick(order.productImageUrl!, order.productName)}
                              onError={(e) => {
                                console.error("Image load error:", order.productImageUrl);
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                              onLoad={() => {
                                console.log("Image loaded successfully:", order.productImageUrl);
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          {/* 디버깅 정보 */}
                          <div className="text-xs text-gray-500 mt-1">
                            {order.productImageUrl ? "이미지 있음" : "이미지 없음"}
                            <br />
                            {order.productId.slice(-4)}
                          </div>
                        </div>
                        
                        {/* 주문 정보 */}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg mb-2">{order.productName}</h4>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">주문번호:</span> {order.id.slice(-8)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            order.status === "processing" ? "bg-blue-100 text-blue-800" :
                            order.status === "completed" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {order.status === "pending" ? "대기중" :
                             order.status === "processing" ? "제작중" :
                             order.status === "completed" ? "완료" : order.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>주문일: {order.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <span>제품: {order.productName}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>고객: {order.customerName}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>상태: {order.status === "pending" ? "대기중" : order.status === "processing" ? "제작중" : order.status === "completed" ? "완료" : order.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* 주문 상태별 추가 정보 */}
                      {order.status === "processing" && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center text-blue-800">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">제작 진행 중입니다.</span>
                          </div>
                        </div>
                      )}
                      
                      {order.status === "completed" && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center text-green-800">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">제작이 완료되었습니다.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="p-6 border-t bg-gray-50 flex justify-end flex-shrink-0">
              <button
                onClick={closeCustomerOrders}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* 헤더 */}
            <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{selectedImageAlt}</h3>
              <button
                onClick={closeImageModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 이미지 영역 */}
            <div className="p-4">
              <div className="relative">
                <img
                  src={selectedImageUrl}
                  alt={selectedImageAlt}
                  className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
                  onError={(e) => {
                    console.error("Modal image load error:", selectedImageUrl);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden max-w-full max-h-[70vh] bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600">이미지를 불러올 수 없습니다</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="p-4 border-t bg-gray-50 flex justify-center">
              <button
                onClick={closeImageModal}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export with dynamic import to ensure client-side rendering
export default dynamic(() => Promise.resolve(AdminPage), {
  ssr: false
}); 