/**
 * Blocks of the Future - Vehicle Delivery Tracking Service
 * 
 * This service handles tracking of vehicle deliveries, including Jeep Wrangler
 * orders and status updates.
 */

// Vehicle delivery database (in-memory)
const deliveries = [
  {
    id: "DEL-789456",
    customerId: 1,
    customerName: "Mark Ward",
    vehicleType: "Jeep Wrangler",
    model: "Rubicon",
    modelYear: 2025,
    vin: "1J4GA59167L192789",
    orderDate: "2025-04-15T08:30:00Z",
    estimatedDeliveryDate: "2025-04-30T14:00:00Z",
    status: "In Transit",
    dealership: {
      name: "Van Devier Jeep",
      address: "7434 Highway Boulevard, Dallas, TX 75231",
      contactPhone: "214-555-7890",
      contactPerson: "James Thompson"
    },
    tracking: [
      {
        timestamp: "2025-04-15T08:30:00Z",
        status: "Order Placed",
        location: "Dallas, TX",
        notes: "Custom order confirmed with dealership"
      },
      {
        timestamp: "2025-04-18T14:45:00Z",
        status: "Vehicle Allocated",
        location: "Toledo, OH",
        notes: "Vehicle assigned from factory production"
      },
      {
        timestamp: "2025-04-21T09:15:00Z",
        status: "Production Complete",
        location: "Toledo, OH",
        notes: "Vehicle completed production and quality checks"
      },
      {
        timestamp: "2025-04-22T11:30:00Z",
        status: "Shipped",
        location: "Toledo, OH",
        notes: "Vehicle loaded for transport to dealership"
      },
      {
        timestamp: "2025-04-25T16:20:00Z",
        status: "In Transit",
        location: "Nashville, TN",
        notes: "Vehicle in transit, estimated arrival in 5 days"
      }
    ],
    paymentInfo: {
      method: "Bank Transfer",
      amount: 58975.00,
      currency: "USD",
      status: "Paid in Full",
      transactionId: "TRFS-982341"
    },
    features: [
      "4.0L V6 Engine",
      "Premium Off-Road Package",
      "Advanced Safety Group",
      "Alpine Premium Audio",
      "Leather Interior",
      "Sky One-Touch Power Top"
    ]
  }
];

// Get all deliveries for a customer
function getCustomerDeliveries(customerId) {
  return deliveries.filter(delivery => delivery.customerId === parseInt(customerId));
}

// Get a specific delivery by ID
function getDeliveryById(deliveryId) {
  return deliveries.find(delivery => delivery.id === deliveryId);
}

// Update delivery status
function updateDeliveryStatus(deliveryId, status, location, notes) {
  const delivery = getDeliveryById(deliveryId);
  if (!delivery) {
    throw new Error(`Delivery not found with ID: ${deliveryId}`);
  }
  
  // Update main status
  delivery.status = status;
  
  // Add to tracking history
  const trackingUpdate = {
    timestamp: new Date().toISOString(),
    status,
    location,
    notes
  };
  
  delivery.tracking.push(trackingUpdate);
  
  return delivery;
}

// Expedite delivery
function expediteDelivery(deliveryId, reason) {
  const delivery = getDeliveryById(deliveryId);
  if (!delivery) {
    throw new Error(`Delivery not found with ID: ${deliveryId}`);
  }
  
  // Mark as expedited
  const currentDate = new Date();
  const expeditedDate = new Date(currentDate);
  expeditedDate.setDate(currentDate.getDate() + 2); // Deliver in 2 days
  
  delivery.expedited = true;
  delivery.expeditedReason = reason;
  delivery.originalDeliveryDate = delivery.estimatedDeliveryDate;
  delivery.estimatedDeliveryDate = expeditedDate.toISOString();
  
  // Add tracking update
  updateDeliveryStatus(
    deliveryId,
    "Expedited",
    delivery.tracking[delivery.tracking.length - 1].location,
    `Delivery expedited at customer request: ${reason}. New delivery date: ${expeditedDate.toLocaleDateString()}`
  );
  
  return delivery;
}

// Cancel delivery
function cancelDelivery(deliveryId, reason) {
  const delivery = getDeliveryById(deliveryId);
  if (!delivery) {
    throw new Error(`Delivery not found with ID: ${deliveryId}`);
  }
  
  // Update status to cancelled
  delivery.status = "Cancelled";
  delivery.cancellationReason = reason;
  delivery.cancellationDate = new Date().toISOString();
  
  // Add tracking update
  const trackingUpdate = {
    timestamp: new Date().toISOString(),
    status: "Cancelled",
    location: delivery.tracking[delivery.tracking.length - 1].location,
    notes: `Delivery cancelled: ${reason}`
  };
  
  delivery.tracking.push(trackingUpdate);
  
  return delivery;
}

// Schedule a delivery appointment
function scheduleDeliveryAppointment(deliveryId, appointmentDate, contactPhone) {
  const delivery = getDeliveryById(deliveryId);
  if (!delivery) {
    throw new Error(`Delivery not found with ID: ${deliveryId}`);
  }
  
  // Ensure appointment date is in the future
  const appointmentDateTime = new Date(appointmentDate);
  const currentDate = new Date();
  
  if (appointmentDateTime <= currentDate) {
    throw new Error("Appointment date must be in the future");
  }
  
  // Set appointment info
  delivery.appointmentInfo = {
    date: appointmentDate,
    confirmed: true,
    contactPhone: contactPhone || delivery.customerPhone,
    createdAt: new Date().toISOString()
  };
  
  // Add tracking update
  updateDeliveryStatus(
    deliveryId,
    "Appointment Scheduled",
    delivery.dealership.address.split(',')[1].trim(), // Extract city from address
    `Delivery appointment scheduled for ${new Date(appointmentDate).toLocaleString()}`
  );
  
  return delivery;
}

// Generate a delivery receipt
function generateDeliveryReceipt(deliveryId) {
  const delivery = getDeliveryById(deliveryId);
  if (!delivery) {
    throw new Error(`Delivery not found with ID: ${deliveryId}`);
  }
  
  // Format the receipt
  const receipt = {
    receiptId: `REC-${deliveryId}`,
    issueDate: new Date().toISOString(),
    customerName: delivery.customerName,
    vehicleDetails: {
      type: delivery.vehicleType,
      model: delivery.model,
      modelYear: delivery.modelYear,
      vin: delivery.vin,
      features: delivery.features
    },
    deliveryInfo: {
      estimatedDeliveryDate: delivery.estimatedDeliveryDate,
      status: delivery.status,
      dealership: delivery.dealership.name,
      address: delivery.dealership.address
    },
    paymentInfo: {
      method: delivery.paymentInfo.method,
      amount: delivery.paymentInfo.amount,
      currency: delivery.paymentInfo.currency,
      status: delivery.paymentInfo.status,
      transactionId: delivery.paymentInfo.transactionId
    },
    legalNotice: "This delivery receipt is issued by Blocks of the Future Financial LLC, LEI: 353800BF65KKDUG751Z27. This document serves as proof of purchase and delivery agreement."
  };
  
  return receipt;
}

// Get tracking URL
function getTrackingUrl(deliveryId) {
  return `https://delivery.blocksofthefuture.com/track/${deliveryId}`;
}

// Calculate estimated time of arrival
function calculateETA(deliveryId) {
  const delivery = getDeliveryById(deliveryId);
  if (!delivery) {
    throw new Error(`Delivery not found with ID: ${deliveryId}`);
  }
  
  const now = new Date();
  const deliveryDate = new Date(delivery.estimatedDeliveryDate);
  
  // Calculate difference in days
  const timeDiff = deliveryDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  let etaMessage;
  if (daysDiff <= 0) {
    etaMessage = "Expected today!";
  } else if (daysDiff === 1) {
    etaMessage = "Expected tomorrow!";
  } else {
    etaMessage = `${daysDiff} days remaining`;
  }
  
  return {
    deliveryId,
    estimatedDeliveryDate: delivery.estimatedDeliveryDate,
    daysRemaining: daysDiff > 0 ? daysDiff : 0,
    etaMessage,
    expedited: delivery.expedited || false,
    trackingUrl: getTrackingUrl(deliveryId)
  };
}

// Export all functions
export default {
  getCustomerDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  expediteDelivery,
  cancelDelivery,
  scheduleDeliveryAppointment,
  generateDeliveryReceipt,
  getTrackingUrl,
  calculateETA
};