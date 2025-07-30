"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAPI } from "@/lib/apiService";
import { useAlert } from "@/components/ui/alertProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Plus, X, Save, User, Ruler, ShoppingCart, ChevronLeft, CheckCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderFormProps {
  slug: string;
  onClose?: () => void;
  initialData?: any;
  isEdit?: boolean;
  editData?: any;
}

export function OrderForm({ slug, onClose, initialData, isEdit = false, editData }: OrderFormProps) {
  const [activeTab, setActiveTab] = useState<'customer' | 'measurement' | 'order'>('customer');
  
  // Customer Information
  const [customerData, setCustomerData] = useState({
    name: '',
    contactNum: '',
    email: '',
    address: '',
    dob: '',
    specialDates: [] as string[]
  });
  const [customerId, setCustomerId] = useState('');
  const [measurementId, setMeasurementId] = useState('');

  // Measurement Data
  const [measurementData, setMeasurementData] = useState({
    measurementType: 'DAURA SURUWAL' as 'DAURA SURUWAL' | 'SUIT',
    basicMeasurements: {
      height: '',
      weight: '',
      age: ''
    },
    topMeasurements: {
      length: '',
      chestAround: '',
      waist: '',
      shoulderWidth: '',
      sleeves: '',
      neck: '',
      biceps: '',
      back: ''
    },
    bottomMeasurements: {
      length: '',
      waist: '',
      hip: '',
      high: '',
      thigh: '',
      knee: '',
      bottom: '',
      calf: ''
    },
    waistCoatMeasurements: {
      length: '',
      chestAround: '',
      waist: '',
      hip: '',
      shoulder: '',
      back: ''
    },
    coatMeasurements: {
      length: '',
      chestAround: '',
      waist: '',
      hip: '',
      shoulder: '',
      sleeve: '',
      biceps: '',
      back: ''
    },
    specialNote: ''
  });

  // Order Data
  const [orderData, setOrderData] = useState({
    customerId: '',
    orderItems: [
      {
        itemType: 'DAURA',
        itemName: '',
        catalogItem: ''
      }
    ],
    factoryId: '',
    measurementId: '',
    paymentStatus: 'Unpaid' as 'Paid' | 'Unpaid' | 'Partial',
    orderStatus: 'Pending' as 'Pending' | 'Cutting' | 'Sewing' | 'Ready' | 'Delivered' | 'Cancelled',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    notes: '',
    totalGrossAmount: 0
  });

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [factories, setFactories] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const { showAlert } = useAlert();

  // Item type options
  const itemTypes = [
    'DAURA',
    'SURUWAL', 
    'SHIRT',
    'PANT',
    'WAIST_COAT',
    'COAT',
    'BLAZER'
  ];

  // Map item types to measurement types
  const getMeasurementTypeForItem = (itemType: string) => {
    switch (itemType) {
      case 'DAURA':
      case 'SURUWAL':
        return 'DAURA SURUWAL';
      case 'SHIRT':
      case 'PANT':
      case 'WAIST_COAT':
      case 'COAT':
      case 'BLAZER':
        return 'SUIT';
      default:
        return 'DAURA SURUWAL';
    }
  };

  // Filter measurements based on selected item types
  const filteredMeasurements = useMemo(() => {
    if (!measurements.length) return [];
    
    const requiredMeasurementTypes = [...new Set(
      orderData.orderItems.map(item => getMeasurementTypeForItem(item.itemType))
    )];
    
    return measurements.filter(measurement => 
      requiredMeasurementTypes.includes(measurement.measurementType)
    );
  }, [measurements, orderData.orderItems]);

  // Load reference data and populate edit data if provided
  useEffect(() => {
    const loadData = async () => {
      const { data: customersData } = await fetchAPI({ endpoint: 'customers', method: 'GET' });
      if (customersData) {
        const customersArray = Array.isArray(customersData) ? customersData : (customersData.data || []);
        setCustomers(customersArray);
      }

      const { data: factoriesData } = await fetchAPI({ endpoint: 'factories', method: 'GET' });
      if (factoriesData) {
        const factoriesArray = Array.isArray(factoriesData) ? factoriesData : (factoriesData.data || []);
        setFactories(factoriesArray);
      }

      const { data: measurementsData } = await fetchAPI({ endpoint: 'measurements', method: 'GET' });
      if (measurementsData) {
        const measurementsArray = Array.isArray(measurementsData) ? measurementsData : (measurementsData.data || []);
        setMeasurements(measurementsArray);
      }

      const { data: catalogsData } = await fetchAPI({ endpoint: 'catalogs', method: 'GET' });
      if (catalogsData) {
        const catalogsArray = Array.isArray(catalogsData) ? catalogsData : (catalogsData.data || []);
        setCatalogs(catalogsArray);
      }

      // Populate form with edit data if provided
      if (editData && isEdit) {
        console.log('Populating form with edit data:', editData);
        
        // Set customer data if available
        if (editData.customerId && typeof editData.customerId === 'object') {
          setCustomerData({
            name: editData.customerId.name || '',
            contactNum: editData.customerId.contactNum || '977000000000',
            email: editData.customerId.email || '',
            address: editData.customerId.address || '',
            dob: editData.customerId.dob || '',
            specialDates: editData.customerId.specialDates || []
          });
          setCustomerId(editData.customerId._id || '');
        }

        // Set measurement data if available
        if (editData.measurementId && typeof editData.measurementId === 'object') {
          setMeasurementData({
            measurementType: editData.measurementId.measurementType || 'DAURA SURUWAL',
            basicMeasurements: editData.measurementId.basicMeasurements || {
              height: '',
              weight: '',
              age: ''
            },
            topMeasurements: editData.measurementId.topMeasurements || {
              length: '',
              chestAround: '',
              waist: '',
              shoulderWidth: '',
              sleeves: '',
              neck: '',
              biceps: '',
              back: ''
            },
            bottomMeasurements: editData.measurementId.bottomMeasurements || {
              length: '',
              waist: '',
              hip: '',
              high: '',
              thigh: '',
              knee: '',
              bottom: '',
              calf: ''
            },
            waistCoatMeasurements: editData.measurementId.waistCoatMeasurements || {
              length: '',
              chestAround: '',
              waist: '',
              hip: '',
              shoulder: '',
              back: ''
            },
            coatMeasurements: editData.measurementId.coatMeasurements || {
              length: '',
              chestAround: '',
              waist: '',
              hip: '',
              shoulder: '',
              sleeve: '',
              biceps: '',
              back: ''
            },
            specialNote: editData.measurementId.specialNote || ''
          });
          setMeasurementId(editData.measurementId._id || '');
        }

        // Set order data
        setOrderData({
          customerId: editData.customerId?._id || editData.customerId || '',
          orderItems: editData.orderItems || [{
            itemType: 'DAURA',
            itemName: '',
            catalogItem: ''
          }],
          factoryId: editData.factoryId?._id || editData.factoryId || '',
          measurementId: editData.measurementId?._id || editData.measurementId || '',
          paymentStatus: editData.paymentStatus || 'Unpaid',
          orderStatus: editData.orderStatus || 'Pending',
          orderDate: editData.orderDate ? new Date(editData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          deliveryDate: editData.deliveryDate ? new Date(editData.deliveryDate).toISOString().split('T')[0] : '',
          totalGrossAmount: editData.totalGrossAmount || 0,
          notes: editData.notes || ''
        });
      }
    };

    loadData();
  }, [editData, isEdit]);

  // Monitor customerId changes
  useEffect(() => {
    console.log('🔄 customerId changed to:', customerId);
  }, [customerId]);

  // Customer handlers
  const handleCustomerChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  // Measurement handlers
  const handleMeasurementChange = (section: string, field: string, value: string) => {
    setMeasurementData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as Record<string, any>),
        [field]: value
      }
    }));
  };

  // Order handlers
  const handleOrderChange = (field: string, value: string) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...orderData.orderItems];
    const currentItem = newItems[index];
    newItems[index] = { 
      itemType: currentItem.itemType,
      itemName: currentItem.itemName,
      catalogItem: currentItem.catalogItem,
      [field]: value 
    };
    setOrderData(prev => ({ ...prev, orderItems: newItems }));
  };

  const addItem = () => {
    setOrderData(prev => ({
      ...prev,
      orderItems: [...prev.orderItems, {
        itemType: 'DAURA',
        itemName: '',
        catalogItem: ''
      }]
    }));
  };

  const removeItem = (index: number) => {
    if (orderData.orderItems.length > 1) {
      setOrderData(prev => ({
        ...prev,
        orderItems: prev.orderItems.filter((_, i) => i !== index)
      }));
    }
  };

  // Save customer first
  const handleSaveCustomer = async () => {
    setLoading(true);
    
    // Format contact number properly - ensure it starts with 977 and has proper length
    let formattedContactNum = customerData.contactNum;
    
    console.log('Original contact number:', formattedContactNum);
    
    // Remove any non-digit characters
    formattedContactNum = formattedContactNum.replace(/\D/g, '');
    
    console.log('After removing non-digits:', formattedContactNum);
    
    // If it's just "977", add some default digits
    if (formattedContactNum === '977') {
      formattedContactNum = '977000000000';
    }
    
    // Ensure it starts with 977
    if (!formattedContactNum.startsWith('977')) {
      formattedContactNum = `977${formattedContactNum}`;
    }
    
    // Ensure it's exactly 12 digits (977 + 9 digits)
    if (formattedContactNum.length < 12) {
      formattedContactNum = formattedContactNum.padEnd(12, '0');
    } else if (formattedContactNum.length > 12) {
      formattedContactNum = formattedContactNum.substring(0, 12);
    }
    
    console.log('Final formatted contact number:', formattedContactNum);
    
    // Validate the contact number format
    if (!/^977\d{9}$/.test(formattedContactNum)) {
      showAlert('Please provide a valid contact number starting with 977 followed by 9 digits', "destructive");
      setLoading(false);
      return;
    }
    
    // Convert specialDates to proper format - each date should be an object with label
    const formattedSpecialDates = customerData.specialDates?.map(date => ({
      date: date,
      type: 'custom',
      label: `Special Date ${new Date(date).toLocaleDateString()}`
    })) || [];
    
    const customerPayload = {
      ...customerData,
      contactNum: formattedContactNum,
      dob: customerData.dob ? new Date(customerData.dob).toISOString() : undefined,
      specialDates: formattedSpecialDates
    };
    
    console.log('Saving customer data:', customerPayload);
    
    const { data, error } = await fetchAPI({
      endpoint: 'customers',
      method: 'POST',
      data: customerPayload,
      withAuth: true,
    });

    console.log('Customer API response:', { data, error });

    if (error) {
      showAlert(`Failed to save customer: ${error}`, "destructive");
    } else {
      showAlert('Customer saved successfully!', "success");
      
      // Try to get customer ID from response first
      let newCustomerId = data._id || data.id || data.customerId;
      
      // If no ID in response, fetch the latest customer
      if (!newCustomerId) {
        console.log('No ID in response, fetching latest customer...');
        const { data: customersData } = await fetchAPI({ endpoint: 'customers', method: 'GET' });
        if (customersData) {
          const customersArray = Array.isArray(customersData) ? customersData : (customersData.data || []);
          if (customersArray.length > 0) {
            // Get the latest customer (assuming it's the one we just created)
            const latestCustomer = customersArray[0]; // or customersArray[customersArray.length - 1]
            newCustomerId = latestCustomer._id || latestCustomer.id || latestCustomer.customerId;
            console.log('Found latest customer ID:', newCustomerId);
          }
          setCustomers(customersArray);
        }
      }
      
      console.log('Available ID fields:', { 
        _id: data._id, 
        id: data.id, 
        customerId: data.customerId,
        fullData: data 
      });
      console.log('Setting customerId to:', newCustomerId);
      setCustomerId(newCustomerId);
      console.log('Customer saved with ID:', newCustomerId);
      
      // Force a small delay to ensure state is updated
      setTimeout(() => {
        console.log('After setTimeout - customerId:', customerId);
      }, 100);
      
      setActiveTab('measurement');
    }
  };

  // Save measurement
  const handleSaveMeasurement = async () => {
    setLoading(true);
    
    console.log('=== MEASUREMENT SAVE DEBUG ===');
    console.log('Current customerId:', customerId);
    console.log('CustomerId type:', typeof customerId);
    console.log('CustomerId truthy check:', !!customerId);
    console.log('CustomerId length:', customerId ? customerId.length : 'N/A');
    console.log('CustomerId value:', JSON.stringify(customerId));
    
    if (!customerId) {
      console.log('❌ CustomerId is falsy, showing error');
      showAlert('Please save customer first', 'destructive');
      setLoading(false);
      return;
    }

    // Convert string values to numbers for measurements
    const convertToNumber = (value: string) => value ? Number(value) : undefined;
    
    const measurementPayload = {
      customerId: customerId,
      measurementType: measurementData.measurementType,
      basicMeasurements: {
        height: convertToNumber(measurementData.basicMeasurements.height),
        weight: convertToNumber(measurementData.basicMeasurements.weight),
        age: convertToNumber(measurementData.basicMeasurements.age)
      },
      topMeasurements: {
        length: Number(measurementData.topMeasurements.length),
        chestAround: Number(measurementData.topMeasurements.chestAround),
        waist: Number(measurementData.topMeasurements.waist),
        shoulderWidth: Number(measurementData.topMeasurements.shoulderWidth),
        sleeves: Number(measurementData.topMeasurements.sleeves),
        neck: Number(measurementData.topMeasurements.neck),
        biceps: convertToNumber(measurementData.topMeasurements.biceps),
        back: convertToNumber(measurementData.topMeasurements.back)
      },
      bottomMeasurements: {
        length: Number(measurementData.bottomMeasurements.length),
        waist: Number(measurementData.bottomMeasurements.waist),
        hip: Number(measurementData.bottomMeasurements.hip),
        high: Number(measurementData.bottomMeasurements.high),
        thigh: Number(measurementData.bottomMeasurements.thigh),
        knee: Number(measurementData.bottomMeasurements.knee),
        bottom: Number(measurementData.bottomMeasurements.bottom),
        calf: convertToNumber(measurementData.bottomMeasurements.calf)
      },
      waistCoatMeasurements: measurementData.measurementType === 'SUIT' ? {
        length: convertToNumber(measurementData.waistCoatMeasurements.length),
        chestAround: convertToNumber(measurementData.waistCoatMeasurements.chestAround),
        waist: convertToNumber(measurementData.waistCoatMeasurements.waist),
        hip: convertToNumber(measurementData.waistCoatMeasurements.hip),
        shoulder: convertToNumber(measurementData.waistCoatMeasurements.shoulder),
        back: convertToNumber(measurementData.waistCoatMeasurements.back)
      } : undefined,
      coatMeasurements: {
        length: Number(measurementData.coatMeasurements.length),
        chestAround: Number(measurementData.coatMeasurements.chestAround),
        waist: Number(measurementData.coatMeasurements.waist),
        hip: Number(measurementData.coatMeasurements.hip),
        shoulder: Number(measurementData.coatMeasurements.shoulder),
        sleeve: Number(measurementData.coatMeasurements.sleeve),
        biceps: Number(measurementData.coatMeasurements.biceps),
        back: Number(measurementData.coatMeasurements.back)
      },
      specialNote: measurementData.specialNote,
      status: 'DRAFT'
    };

    const { data, error } = await fetchAPI({
      endpoint: 'measurements',
      method: 'POST',
      data: measurementPayload,
      withAuth: true,
    });

    if (error) {
      showAlert(`Failed to save measurement: ${error}`, "destructive");
    } else {
      showAlert('Measurement saved successfully!', "success");
      const newMeasurementId = data._id || data.id || data.measurementId;
      setMeasurementId(newMeasurementId);
      console.log('Measurement saved with ID:', newMeasurementId);
      
      // Refresh measurements list
      const { data: measurementsData } = await fetchAPI({ endpoint: 'measurements', method: 'GET' });
      if (measurementsData) {
        const measurementsArray = Array.isArray(measurementsData) ? measurementsData : (measurementsData.data || []);
        setMeasurements(measurementsArray);
      }
      setActiveTab('order');
    }
    
    setLoading(false);
  };

  // Submit order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!measurementId) {
      showAlert('Please save measurement first', 'destructive');
      setLoading(false);
      return;
    }

    const orderPayload = {
      customerId: customerId,
      orderItems: orderData.orderItems,
      factoryId: orderData.factoryId,
      measurementId: measurementId,
      paymentStatus: orderData.paymentStatus,
      orderStatus: orderData.orderStatus,
      orderDate: new Date(orderData.orderDate),
      deliveryDate: orderData.deliveryDate ? new Date(orderData.deliveryDate) : undefined,
      notes: orderData.notes,
      totalGrossAmount: orderData.totalGrossAmount
    };

    const { error } = await fetchAPI({
      endpoint: slug,
      method: isEdit ? 'PUT' : 'POST',
      data: orderPayload,
      withAuth: true,
    });

    if (error) {
      showAlert(`Failed to ${isEdit ? 'update' : 'create'} order: ${error}`, "destructive");
    } else {
      showAlert(`Order ${isEdit ? 'updated' : 'created'} successfully!`, "success");
      if (onClose) onClose();
    }
    
    setLoading(false);
  };

  const getMeasurementTypeDescription = (measurementType: string) => {
    switch (measurementType) {
      case 'DAURA SURUWAL':
        return 'Daura Suruwal Measurements';
      case 'SUIT':
        return 'Suit Measurements';
      default:
        return measurementType;
    }
  };

  const renderCustomerTab = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="border-b border-gray-200 pb-4 sm:pb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Customer Information</h2>
        <p className="text-sm sm:text-base text-gray-600">Please provide the customer's basic details to proceed with the order.</p>
      </div>

      {/* Personal Information Section */}
      <div className="bg-primary/5 rounded-lg p-4 sm:p-6 border border-primary/20">
        <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4 flex items-center">
          <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={customerData.name}
              onChange={(e) => handleCustomerChange('name', e.target.value)}
              placeholder="Enter full customer name"
              className="h-10 sm:h-12 text-sm sm:text-base"
              required
            />
            <p className="text-xs text-gray-500">Enter the customer's full name as it appears on official documents</p>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <Input
              value={customerData.contactNum}
              onChange={(e) => handleCustomerChange('contactNum', e.target.value)}
              placeholder="977XXXXXXXXX"
              className="h-10 sm:h-12 text-sm sm:text-base"
              required
            />
            <p className="text-xs text-gray-500">Enter the contact number with country code (977)</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <Input
              value={customerData.email}
              onChange={(e) => handleCustomerChange('email', e.target.value)}
              placeholder="customer@example.com"
              type="email"
              className="h-10 sm:h-12 text-sm sm:text-base"
            />
            <p className="text-xs text-gray-500">Optional: For order notifications and updates</p>
          </div>
        </div>
      </div>

      {/* Additional Details Section */}
      <div className="bg-muted rounded-lg p-4 sm:p-6 border border-border">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Additional Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 sm:h-12 text-sm sm:text-base",
                      !customerData.dob && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customerData.dob ? new Date(customerData.dob).toLocaleDateString() : "Select date of birth"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customerData.dob ? new Date(customerData.dob) : undefined}
                    onSelect={(date) => handleCustomerChange('dob', date ? date.toISOString().split('T')[0] : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500">Required for age-appropriate measurements</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Special Dates
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 sm:h-12 text-sm sm:text-base",
                      !customerData.specialDates?.length && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customerData.specialDates?.length 
                      ? `${customerData.specialDates.length} date(s) selected: ${customerData.specialDates.slice(0, 2).join(', ')}${customerData.specialDates.length > 2 ? '...' : ''}`
                      : "Select special dates"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="multiple"
                    selected={customerData.specialDates?.map(date => new Date(date)) || []}
                    onSelect={(dates) => {
                      console.log('Selected dates:', dates);
                      const dateStrings = dates?.map(date => date.toISOString().split('T')[0]) || [];
                      console.log('Date strings:', dateStrings);
                      setCustomerData(prev => ({ ...prev, specialDates: dateStrings }));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500">Optional: Select important dates for the customer</p>
            </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-primary/5 rounded-lg p-4 sm:p-6 border border-primary/20">
        <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4 flex items-center">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Address
        </h3>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Customer Address
          </label>
          <Input
            value={customerData.address}
            onChange={(e) => handleCustomerChange('address', e.target.value)}
            placeholder="Enter customer address"
            className="h-10 sm:h-12 text-sm sm:text-base"
          />
          <p className="text-xs text-gray-500">Optional: Customer's address</p>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="bg-accent rounded-lg p-3 sm:p-4 border border-border">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-foreground">Required Fields</h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>Please ensure all fields marked with <span className="text-red-500 font-bold">*</span> are completed before proceeding.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMeasurementTab = () => (
    <div className="space-y-6">
      {/* Measurement Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Measurement Type *
        </label>
        <select
          value={measurementData.measurementType}
          onChange={(e) => setMeasurementData(prev => ({ ...prev, measurementType: e.target.value as 'DAURA SURUWAL' | 'SUIT' }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="DAURA SURUWAL">Daura Suruwal</option>
          <option value="SUIT">Suit</option>
        </select>
      </div>

      {/* Basic Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
              <Input
                value={measurementData.basicMeasurements.height}
                onChange={(e) => handleMeasurementChange('basicMeasurements', 'height', e.target.value)}
                type="number"
                placeholder="Height"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <Input
                value={measurementData.basicMeasurements.weight}
                onChange={(e) => handleMeasurementChange('basicMeasurements', 'weight', e.target.value)}
                type="number"
                placeholder="Weight"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <Input
                value={measurementData.basicMeasurements.age}
                onChange={(e) => handleMeasurementChange('basicMeasurements', 'age', e.target.value)}
                type="number"
                placeholder="Age"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Garment Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
              <Input
                value={measurementData.topMeasurements.length}
                onChange={(e) => handleMeasurementChange('topMeasurements', 'length', e.target.value)}
                type="number"
                placeholder="Length"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chest Around</label>
              <Input
                value={measurementData.topMeasurements.chestAround}
                onChange={(e) => handleMeasurementChange('topMeasurements', 'chestAround', e.target.value)}
                type="number"
                placeholder="Chest"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Waist</label>
              <Input
                value={measurementData.topMeasurements.waist}
                onChange={(e) => handleMeasurementChange('topMeasurements', 'waist', e.target.value)}
                type="number"
                placeholder="Waist"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shoulder Width</label>
              <Input
                value={measurementData.topMeasurements.shoulderWidth}
                onChange={(e) => handleMeasurementChange('topMeasurements', 'shoulderWidth', e.target.value)}
                type="number"
                placeholder="Shoulder"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sleeves</label>
              <Input
                value={measurementData.topMeasurements.sleeves}
                onChange={(e) => handleMeasurementChange('topMeasurements', 'sleeves', e.target.value)}
                type="number"
                placeholder="Sleeves"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Neck</label>
              <Input
                value={measurementData.topMeasurements.neck}
                onChange={(e) => handleMeasurementChange('topMeasurements', 'neck', e.target.value)}
                type="number"
                placeholder="Neck"
                required
              />
            </div>
            {measurementData.measurementType === 'SUIT' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Biceps</label>
                  <Input
                    value={measurementData.topMeasurements.biceps}
                    onChange={(e) => handleMeasurementChange('topMeasurements', 'biceps', e.target.value)}
                    type="number"
                    placeholder="Biceps"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Back</label>
                  <Input
                    value={measurementData.topMeasurements.back}
                    onChange={(e) => handleMeasurementChange('topMeasurements', 'back', e.target.value)}
                    type="number"
                    placeholder="Back"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bottom Garment Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
              <Input
                value={measurementData.bottomMeasurements.length}
                onChange={(e) => handleMeasurementChange('bottomMeasurements', 'length', e.target.value)}
                type="number"
                placeholder="Length"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Waist</label>
              <Input
                value={measurementData.bottomMeasurements.waist}
                onChange={(e) => handleMeasurementChange('bottomMeasurements', 'waist', e.target.value)}
                type="number"
                placeholder="Waist"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hip</label>
              <Input
                value={measurementData.bottomMeasurements.hip}
                onChange={(e) => handleMeasurementChange('bottomMeasurements', 'hip', e.target.value)}
                type="number"
                placeholder="Hip"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">High</label>
              <Input
                value={measurementData.bottomMeasurements.high}
                onChange={(e) => handleMeasurementChange('bottomMeasurements', 'high', e.target.value)}
                type="number"
                placeholder="High"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thigh</label>
              <Input
                value={measurementData.bottomMeasurements.thigh}
                onChange={(e) => handleMeasurementChange('bottomMeasurements', 'thigh', e.target.value)}
                type="number"
                placeholder="Thigh"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Knee</label>
              <Input
                value={measurementData.bottomMeasurements.knee}
                onChange={(e) => handleMeasurementChange('bottomMeasurements', 'knee', e.target.value)}
                type="number"
                placeholder="Knee"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bottom</label>
              <Input
                value={measurementData.bottomMeasurements.bottom}
                onChange={(e) => handleMeasurementChange('bottomMeasurements', 'bottom', e.target.value)}
                type="number"
                placeholder="Bottom"
                required
              />
            </div>
            {measurementData.measurementType === 'DAURA SURUWAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calf</label>
                <Input
                  value={measurementData.bottomMeasurements.calf}
                  onChange={(e) => handleMeasurementChange('bottomMeasurements', 'calf', e.target.value)}
                  type="number"
                  placeholder="Calf"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Waist Coat Measurements (SUIT only) */}
      {measurementData.measurementType === 'SUIT' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Waist Coat Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                <Input
                  value={measurementData.waistCoatMeasurements.length}
                  onChange={(e) => handleMeasurementChange('waistCoatMeasurements', 'length', e.target.value)}
                  type="number"
                  placeholder="Length"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chest Around</label>
                <Input
                  value={measurementData.waistCoatMeasurements.chestAround}
                  onChange={(e) => handleMeasurementChange('waistCoatMeasurements', 'chestAround', e.target.value)}
                  type="number"
                  placeholder="Chest"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Waist</label>
                <Input
                  value={measurementData.waistCoatMeasurements.waist}
                  onChange={(e) => handleMeasurementChange('waistCoatMeasurements', 'waist', e.target.value)}
                  type="number"
                  placeholder="Waist"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hip</label>
                <Input
                  value={measurementData.waistCoatMeasurements.hip}
                  onChange={(e) => handleMeasurementChange('waistCoatMeasurements', 'hip', e.target.value)}
                  type="number"
                  placeholder="Hip"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shoulder</label>
                <Input
                  value={measurementData.waistCoatMeasurements.shoulder}
                  onChange={(e) => handleMeasurementChange('waistCoatMeasurements', 'shoulder', e.target.value)}
                  type="number"
                  placeholder="Shoulder"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Back</label>
                <Input
                  value={measurementData.waistCoatMeasurements.back}
                  onChange={(e) => handleMeasurementChange('waistCoatMeasurements', 'back', e.target.value)}
                  type="number"
                  placeholder="Back"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coat Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Coat Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
              <Input
                value={measurementData.coatMeasurements.length}
                onChange={(e) => handleMeasurementChange('coatMeasurements', 'length', e.target.value)}
                type="number"
                placeholder="Length"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chest Around</label>
              <Input
                value={measurementData.coatMeasurements.chestAround}
                onChange={(e) => handleMeasurementChange('coatMeasurements', 'chestAround', e.target.value)}
                type="number"
                placeholder="Chest"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Waist</label>
              <Input
                value={measurementData.coatMeasurements.waist}
                onChange={(e) => handleMeasurementChange('coatMeasurements', 'waist', e.target.value)}
                type="number"
                placeholder="Waist"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hip</label>
              <Input
                value={measurementData.coatMeasurements.hip}
                onChange={(e) => handleMeasurementChange('coatMeasurements', 'hip', e.target.value)}
                type="number"
                placeholder="Hip"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shoulder</label>
              <Input
                value={measurementData.coatMeasurements.shoulder}
                onChange={(e) => handleMeasurementChange('coatMeasurements', 'shoulder', e.target.value)}
                type="number"
                placeholder="Shoulder"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sleeve</label>
              <Input
                value={measurementData.coatMeasurements.sleeve}
                onChange={(e) => handleMeasurementChange('coatMeasurements', 'sleeve', e.target.value)}
                type="number"
                placeholder="Sleeve"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Biceps</label>
              <Input
                value={measurementData.coatMeasurements.biceps}
                onChange={(e) => handleMeasurementChange('coatMeasurements', 'biceps', e.target.value)}
                type="number"
                placeholder="Biceps"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Back</label>
              <Input
                value={measurementData.coatMeasurements.back}
                onChange={(e) => handleMeasurementChange('coatMeasurements', 'back', e.target.value)}
                type="number"
                placeholder="Back"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Notes
        </label>
        <textarea
          value={measurementData.specialNote}
          onChange={(e) => setMeasurementData(prev => ({ ...prev, specialNote: e.target.value }))}
          placeholder="Enter any special notes..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );

  const renderOrderTab = () => (
    <div className="space-y-6">
      {/* Order Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !orderData.orderDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {orderData.orderDate || "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={orderData.orderDate ? new Date(orderData.orderDate) : undefined}
                onSelect={(date) => handleOrderChange('orderDate', date ? date.toISOString().split('T')[0] : '')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !orderData.deliveryDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {orderData.deliveryDate || "Select delivery date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={orderData.deliveryDate ? new Date(orderData.deliveryDate) : undefined}
                onSelect={(date) => handleOrderChange('deliveryDate', date ? date.toISOString().split('T')[0] : '')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Factory Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Factory Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Factory *
            </label>
            <select
              value={orderData.factoryId}
              onChange={(e) => handleOrderChange('factoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select factory</option>
              {factories.map((factory) => (
                <option key={factory._id} value={factory._id}>
                  {factory.name || factory.factoryName || factory.title || `Factory ${factory._id}`}
                </option>
              ))}
            </select>
            {orderData.factoryId && (
              <p className="text-sm text-gray-500 mt-1">
                Selected: {factories.find(f => f._id === orderData.factoryId)?.name || 
                          factories.find(f => f._id === orderData.factoryId)?.factoryName || 
                          `Factory ${orderData.factoryId}`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Order Items</CardTitle>
            <Button type="button" onClick={addItem} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderData.orderItems.map((item, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Item {index + 1}</h4>
                {orderData.orderItems.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeItem(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Type *
                  </label>
                  <select
                    value={item.itemType}
                    onChange={(e) => handleItemChange(index, 'itemType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {itemTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <Input
                    value={item.itemName}
                    onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                    placeholder="Enter item name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catalog Item *
                  </label>
                  <select
                    value={item.catalogItem}
                    onChange={(e) => handleItemChange(index, 'catalogItem', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select catalog item</option>
                    {catalogs.map((catalog) => (
                      <option key={catalog._id} value={catalog._id}>
                        {catalog.name || catalog.itemName || `Catalog ${catalog._id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Measurement Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Measurement Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Measurement *
            </label>
            <select
              value={orderData.measurementId}
              onChange={(e) => {
                handleOrderChange('measurementId', e.target.value);
                // Auto-fill measurement ID when measurement is selected
                if (e.target.value) {
                  setMeasurementId(e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select measurement</option>
              {filteredMeasurements.map((measurement) => (
                <option key={measurement._id} value={measurement._id}>
                  {measurement.customerName || measurement.name || `Measurement ${measurement._id}`} 
                  {' - '}
                  {getMeasurementTypeDescription(measurement.measurementType)}
                </option>
              ))}
            </select>
            {filteredMeasurements.length === 0 && measurements.length > 0 && (
              <p className="text-sm text-orange-600 mt-1">
                No compatible measurements found for the selected item types. 
                Please add measurements for: {orderData.orderItems.map(item => getMeasurementTypeForItem(item.itemType)).join(', ')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                value={orderData.orderStatus}
                onChange={(e) => handleOrderChange('orderStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Cutting">Cutting</option>
                <option value="Sewing">Sewing</option>
                <option value="Ready">Ready</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={orderData.paymentStatus}
                onChange={(e) => handleOrderChange('paymentStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Amount
            </label>
            <Input
              value={orderData.totalGrossAmount}
              onChange={(e) => handleOrderChange('totalGrossAmount', e.target.value)}
              placeholder="Enter total amount"
              type="number"
              step="0.01"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={orderData.notes}
              onChange={(e) => handleOrderChange('notes', e.target.value)}
              placeholder="Enter any additional notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl mx-auto max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {isEdit ? 'Edit Order' : 'Create New Order'}
              </h1>
              <p className="text-blue-100 mt-1">
                {activeTab === 'customer' && 'Step 1: Customer Information'}
                {activeTab === 'measurement' && 'Step 2: Measurement Details'}
                {activeTab === 'order' && 'Step 3: Order Details'}
              </p>
            </div>
            {onClose && (
              <Button 
                variant="ghost" 
                onClick={onClose} 
                size="sm" 
                className="text-white hover:bg-blue-700 rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-muted px-4 sm:px-6 py-3 sm:py-4 border-b">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              onClick={() => setActiveTab('customer')}
              className={cn(
                "flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 min-w-fit",
                activeTab === 'customer'
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              )}
            >
              <div className={cn(
                "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold",
                activeTab === 'customer' ? "bg-white text-primary" : "bg-gray-300 text-gray-600"
              )}>
                1
              </div>
              <span className="hidden sm:inline">Customer</span>
              <span className="sm:hidden">Cust</span>
              {customerId && (
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('measurement')}
              className={cn(
                "flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 min-w-fit",
                activeTab === 'measurement'
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              )}
            >
              <div className={cn(
                "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold",
                activeTab === 'measurement' ? "bg-white text-primary" : "bg-gray-300 text-gray-600"
              )}>
                2
              </div>
              <span className="hidden sm:inline">Measurement</span>
              <span className="sm:hidden">Meas</span>
              {measurementId && (
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('order')}
              className={cn(
                "flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 min-w-fit",
                activeTab === 'order'
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              )}
            >
              <div className={cn(
                "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold",
                activeTab === 'order' ? "bg-white text-primary" : "bg-gray-300 text-gray-600"
              )}>
                3
              </div>
              <span className="hidden sm:inline">Order</span>
              <span className="sm:hidden">Order</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-muted scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          <div className="w-full p-3 sm:p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[500px] sm:min-h-[600px]">
              <div className="p-4 sm:p-6">
                {activeTab === 'customer' && renderCustomerTab()}
                {activeTab === 'measurement' && renderMeasurementTab()}
                {activeTab === 'order' && renderOrderTab()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-muted px-6 py-4 border-t">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => {
                if (activeTab === 'measurement') setActiveTab('customer');
                if (activeTab === 'order') setActiveTab('measurement');
              }}
              disabled={activeTab === 'customer'}
              className="px-6 py-2"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-3">
              {activeTab === 'customer' && (
                                  <Button
                    type="button"
                    onClick={handleSaveCustomer}
                    disabled={!customerData.name || !customerData.contactNum || !customerData.dob || loading}
                  >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Customer...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Customer & Continue
                    </div>
                  )}
                </Button>
              )}
              {activeTab === 'measurement' && (
                                  <Button
                    type="button"
                    onClick={handleSaveMeasurement}
                    disabled={!measurementData.measurementType || loading}
                  >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Measurement...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Measurement & Continue
                    </div>
                  )}
                </Button>
              )}
              {activeTab === 'order' && (
                <form onSubmit={handleSubmitOrder} className="flex gap-3">
                  {onClose && (
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Order...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Create Order
                      </div>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}