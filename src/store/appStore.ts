import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'customer' | 'detailer' | 'admin';
export type BookingStatus = 'pending_payment' | 'payment_confirmed' | 'booking_confirmed' | 'detailer_assigned' | 'en_route' | 'in_progress' | 'completed' | 'rated' | 'cancelled';
export type PaymentMethod = 'mpesa' | 'crypto';
export type ServiceType = 'doorstep' | 'station';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  plate: string;
  nickname: string;
  type: 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'van';
}

export interface ServicePackage {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: string;
  features: string[];
}

export interface Station {
  id: string;
  name: string;
  area: string;
  address: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  availability: 'available' | 'busy' | 'offline';
  image: string;
  services: string[];
}

export interface Detailer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  availability: 'available' | 'busy' | 'offline';
  image: string;
  services: string[];
  isOnline: boolean;
  walletAddress?: string;
  mpesaNumber?: string;
  status: 'pending' | 'approved' | 'suspended';
  earnings: number;
  completedJobs: number;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleNickname: string;
  serviceType: ServiceType;
  packageId: string;
  packageName: string;
  basePrice: number;
  opsCost: number;
  platformFee: number;
  totalPrice: number;
  detailerId?: string;
  detailerName?: string;
  stationId?: string;
  stationName?: string;
  scheduledDate: string;
  scheduledTime: string;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  locationArea?: string;
  status: BookingStatus;
  paymentMethod?: PaymentMethod;
  paymentRef?: string;
  txHash?: string;
  mpesaReceipt?: string;
  rating?: number;
  tip?: number;
  tipMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  statusHistory: { status: BookingStatus; timestamp: string; note?: string }[];
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  detailerId: string;
  detailerName: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'approved' | 'paid';
  reference?: string;
  createdAt: string;
  paidAt?: string;
}

export interface LoyaltyProgress {
  userId: string;
  points: number;
  totalWashes: number;
  redeemedRewards: number;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  type: 'booking_confirmed' | 'payment_received' | 'detailer_assigned' | 'service_completed' | 'payout_approved';
  sentAt: string;
  bookingId?: string;
}

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Data
  users: User[];
  vehicles: Vehicle[];
  stations: Station[];
  detailers: Detailer[];
  bookings: Booking[];
  payments: Payment[];
  payouts: Payout[];
  loyaltyProgress: LoyaltyProgress[];
  emailLogs: EmailLog[];
  
  // Actions
  login: (role: UserRole) => void;
  logout: () => void;
  
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  removeVehicle: (id: string) => void;
  
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>) => string;
  updateBookingStatus: (id: string, status: BookingStatus, note?: string) => void;
  cancelBooking: (id: string) => void;
  rateBooking: (id: string, rating: number) => void;
  tipBooking: (id: string, amount: number, method: PaymentMethod) => void;
  assignDetailer: (bookingId: string, detailerId: string) => void;
  
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  
  createPayout: (payout: Omit<Payout, 'id' | 'createdAt'>) => void;
  approvePayout: (id: string, reference: string) => void;
  
  updateLoyalty: (userId: string) => void;
  redeemReward: (userId: string) => void;
  
  updateDetailerStatus: (id: string, isOnline: boolean) => void;
  updateDetailerAvailability: (id: string, availability: 'available' | 'busy' | 'offline') => void;
  approveDetailer: (id: string) => void;
  suspendDetailer: (id: string) => void;
  
  addEmailLog: (log: Omit<EmailLog, 'id' | 'sentAt'>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Mock data
const mockStations: Station[] = [
  { id: 's1', name: 'Westlands Premium Wash', area: 'Westlands', address: 'Sarit Centre, Karuna Rd', rating: 4.8, reviewCount: 234, priceRange: 'KES 500-4,500', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive', 'interior', 'full'] },
  { id: 's2', name: 'Kilimani Auto Spa', area: 'Kilimani', address: 'Argwings Kodhek Rd', rating: 4.6, reviewCount: 156, priceRange: 'KES 600-5,000', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive', 'full'] },
  { id: 's3', name: 'CBD Express Wash', area: 'CBD', address: 'Kenyatta Avenue', rating: 4.3, reviewCount: 89, priceRange: 'KES 400-3,500', availability: 'busy', image: '/placeholder.svg', services: ['basic', 'executive'] },
  { id: 's4', name: 'Lavington DetailPro', area: 'Lavington', address: 'James Gichuru Rd', rating: 4.9, reviewCount: 312, priceRange: 'KES 800-6,000', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive', 'interior', 'full'] },
  { id: 's5', name: 'South B Clean Machine', area: 'South B', address: 'Mombasa Rd', rating: 4.4, reviewCount: 67, priceRange: 'KES 450-4,000', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive', 'interior'] },
  { id: 's6', name: 'South C AutoCare', area: 'South C', address: 'Mugoya Estate', rating: 4.5, reviewCount: 98, priceRange: 'KES 500-4,500', availability: 'offline', image: '/placeholder.svg', services: ['basic', 'executive', 'full'] },
  { id: 's7', name: 'Karen Elite Detailing', area: 'Karen', address: 'Karen Shopping Centre', rating: 4.9, reviewCount: 445, priceRange: 'KES 1,000-8,000', availability: 'available', image: '/placeholder.svg', services: ['executive', 'interior', 'full'] },
  { id: 's8', name: 'Parklands Quick Wash', area: 'Parklands', address: '3rd Parklands Ave', rating: 4.2, reviewCount: 45, priceRange: 'KES 400-3,000', availability: 'busy', image: '/placeholder.svg', services: ['basic', 'executive'] },
];

const mockDetailers: Detailer[] = [
  { id: 'd1', userId: 'u_d1', name: 'James Mwangi', phone: '+254722123456', email: 'james@email.com', area: 'Westlands', rating: 4.9, reviewCount: 178, priceRange: 'KES 500-4,500', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive', 'interior', 'full'], isOnline: true, mpesaNumber: '+254722123456', status: 'approved', earnings: 45600, completedJobs: 89 },
  { id: 'd2', userId: 'u_d2', name: 'Peter Ochieng', phone: '+254733234567', email: 'peter@email.com', area: 'Kilimani', rating: 4.7, reviewCount: 134, priceRange: 'KES 600-5,000', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive', 'full'], isOnline: true, walletAddress: '0x1234...5678', status: 'approved', earnings: 38900, completedJobs: 67 },
  { id: 'd3', userId: 'u_d3', name: 'Samuel Kamau', phone: '+254744345678', email: 'samuel@email.com', area: 'CBD', rating: 4.5, reviewCount: 89, priceRange: 'KES 400-3,500', availability: 'busy', image: '/placeholder.svg', services: ['basic', 'executive'], isOnline: true, mpesaNumber: '+254744345678', status: 'approved', earnings: 28700, completedJobs: 56 },
  { id: 'd4', userId: 'u_d4', name: 'David Njoroge', phone: '+254755456789', email: 'david@email.com', area: 'Lavington', rating: 4.8, reviewCount: 212, priceRange: 'KES 700-5,500', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive', 'interior', 'full'], isOnline: true, walletAddress: '0x5678...9012', status: 'approved', earnings: 52300, completedJobs: 98 },
  { id: 'd5', userId: 'u_d5', name: 'John Wanyama', phone: '+254766567890', email: 'john@email.com', area: 'South B', rating: 4.4, reviewCount: 56, priceRange: 'KES 450-4,000', availability: 'offline', image: '/placeholder.svg', services: ['basic', 'executive'], isOnline: false, mpesaNumber: '+254766567890', status: 'approved', earnings: 19200, completedJobs: 34 },
  { id: 'd6', userId: 'u_d6', name: 'Michael Otieno', phone: '+254777678901', email: 'michael@email.com', area: 'South C', rating: 4.6, reviewCount: 78, priceRange: 'KES 500-4,200', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive', 'interior'], isOnline: true, mpesaNumber: '+254777678901', status: 'approved', earnings: 31500, completedJobs: 45 },
  { id: 'd7', userId: 'u_d7', name: 'Brian Kiprop', phone: '+254788789012', email: 'brian@email.com', area: 'Karen', rating: 4.9, reviewCount: 289, priceRange: 'KES 800-6,500', availability: 'available', image: '/placeholder.svg', services: ['executive', 'interior', 'full'], isOnline: true, walletAddress: '0x9012...3456', status: 'approved', earnings: 67800, completedJobs: 123 },
  { id: 'd8', userId: 'u_d8', name: 'Dennis Mutua', phone: '+254799890123', email: 'dennis@email.com', area: 'Westlands', rating: 4.5, reviewCount: 67, priceRange: 'KES 500-4,000', availability: 'busy', image: '/placeholder.svg', services: ['basic', 'executive'], isOnline: true, mpesaNumber: '+254799890123', status: 'approved', earnings: 24100, completedJobs: 41 },
  { id: 'd9', userId: 'u_d9', name: 'Eric Wamalwa', phone: '+254700901234', email: 'eric@email.com', area: 'Kilimani', rating: 4.7, reviewCount: 145, priceRange: 'KES 550-4,800', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive', 'interior'], isOnline: true, walletAddress: '0x3456...7890', status: 'approved', earnings: 41200, completedJobs: 78 },
  { id: 'd10', userId: 'u_d10', name: 'Kevin Omondi', phone: '+254711012345', email: 'kevin@email.com', area: 'Parklands', rating: 4.3, reviewCount: 34, priceRange: 'KES 400-3,500', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive'], isOnline: true, mpesaNumber: '+254711012345', status: 'pending', earnings: 0, completedJobs: 0 },
  { id: 'd11', userId: 'u_d11', name: 'Victor Wekesa', phone: '+254722123789', email: 'victor@email.com', area: 'CBD', rating: 4.6, reviewCount: 98, priceRange: 'KES 450-4,000', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive', 'full'], isOnline: true, mpesaNumber: '+254722123789', status: 'approved', earnings: 35600, completedJobs: 62 },
  { id: 'd12', userId: 'u_d12', name: 'Alex Kibet', phone: '+254733234890', email: 'alex@email.com', area: 'Lavington', rating: 4.8, reviewCount: 167, priceRange: 'KES 600-5,200', availability: 'available', image: '/placeholder.svg', services: ['basic', 'executive', 'interior', 'full'], isOnline: true, walletAddress: '0x7890...1234', status: 'approved', earnings: 48900, completedJobs: 85 },
];

const mockVehicles: Vehicle[] = [
  { id: 'v1', userId: 'customer', plate: 'KDA 123A', nickname: 'Daily Driver', type: 'sedan' },
  { id: 'v2', userId: 'customer', plate: 'KDB 456B', nickname: 'Family SUV', type: 'suv' },
  { id: 'v3', userId: 'customer', plate: 'KDC 789C', nickname: 'Weekend Car', type: 'hatchback' },
];

const mockBookings: Booking[] = [
  {
    id: 'b1',
    customerId: 'customer',
    customerName: 'Demo Customer',
    vehicleId: 'v1',
    vehiclePlate: 'KDA 123A',
    vehicleNickname: 'Daily Driver',
    serviceType: 'doorstep',
    packageId: 'executive',
    packageName: 'Executive Wash',
    basePrice: 1200,
    opsCost: 150,
    platformFee: 100,
    totalPrice: 1450,
    detailerId: 'd1',
    detailerName: 'James Mwangi',
    scheduledDate: '2024-01-20',
    scheduledTime: '10:00',
    location: 'Westlands, Nairobi',
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaReceipt: 'QK43HS7612',
    rating: 5,
    createdAt: '2024-01-19T08:00:00Z',
    updatedAt: '2024-01-20T11:30:00Z',
    statusHistory: [
      { status: 'pending_payment', timestamp: '2024-01-19T08:00:00Z' },
      { status: 'payment_confirmed', timestamp: '2024-01-19T08:02:00Z' },
      { status: 'booking_confirmed', timestamp: '2024-01-19T08:10:00Z' },
      { status: 'detailer_assigned', timestamp: '2024-01-19T08:15:00Z' },
      { status: 'en_route', timestamp: '2024-01-20T09:45:00Z' },
      { status: 'in_progress', timestamp: '2024-01-20T10:00:00Z' },
      { status: 'completed', timestamp: '2024-01-20T11:00:00Z' },
      { status: 'rated', timestamp: '2024-01-20T11:30:00Z' },
    ],
  },
  {
    id: 'b2',
    customerId: 'customer',
    customerName: 'Demo Customer',
    vehicleId: 'v2',
    vehiclePlate: 'KDB 456B',
    vehicleNickname: 'Family SUV',
    serviceType: 'station',
    packageId: 'full',
    packageName: 'Full Detail',
    basePrice: 4500,
    opsCost: 300,
    platformFee: 200,
    totalPrice: 5000,
    stationId: 's4',
    stationName: 'Lavington DetailPro',
    scheduledDate: '2024-01-25',
    scheduledTime: '14:00',
    status: 'in_progress',
    paymentMethod: 'crypto',
    txHash: '0xabc123def456...',
    createdAt: '2024-01-24T12:00:00Z',
    updatedAt: '2024-01-25T14:15:00Z',
    statusHistory: [
      { status: 'pending_payment', timestamp: '2024-01-24T12:00:00Z' },
      { status: 'payment_confirmed', timestamp: '2024-01-24T12:05:00Z' },
      { status: 'booking_confirmed', timestamp: '2024-01-24T12:30:00Z' },
      { status: 'in_progress', timestamp: '2024-01-25T14:00:00Z' },
    ],
  },
  {
    id: 'b3',
    customerId: 'customer',
    customerName: 'Demo Customer',
    vehicleId: 'v1',
    vehiclePlate: 'KDA 123A',
    vehicleNickname: 'Daily Driver',
    serviceType: 'doorstep',
    packageId: 'basic',
    packageName: 'Basic Wash',
    basePrice: 500,
    opsCost: 100,
    platformFee: 50,
    totalPrice: 650,
    detailerId: 'd2',
    detailerName: 'Peter Ochieng',
    scheduledDate: '2024-01-28',
    scheduledTime: '09:00',
    location: 'Kilimani, Nairobi',
    status: 'detailer_assigned',
    paymentMethod: 'mpesa',
    mpesaReceipt: 'QK55MT8934',
    createdAt: '2024-01-27T18:00:00Z',
    updatedAt: '2024-01-27T18:20:00Z',
    statusHistory: [
      { status: 'pending_payment', timestamp: '2024-01-27T18:00:00Z' },
      { status: 'payment_confirmed', timestamp: '2024-01-27T18:03:00Z' },
      { status: 'booking_confirmed', timestamp: '2024-01-27T18:10:00Z' },
      { status: 'detailer_assigned', timestamp: '2024-01-27T18:20:00Z' },
    ],
  },
];

const mockLoyalty: LoyaltyProgress[] = [
  { userId: 'customer', points: 7, totalWashes: 17, redeemedRewards: 1 },
];

export const servicePackages: ServicePackage[] = [
  { id: 'basic', name: 'Basic Wash', price: 500, description: 'Exterior wash with rinse and dry', duration: '30 min', features: ['Exterior wash', 'Wheel cleaning', 'Windows cleaned', 'Tire shine'] },
  { id: 'executive', name: 'Executive Wash', price: 1200, description: 'Full exterior + interior vacuum', duration: '1 hour', features: ['Everything in Basic', 'Interior vacuum', 'Dashboard wipe', 'Air freshener', 'Door jambs cleaned'] },
  { id: 'interior', name: 'Interior Detail', price: 2500, description: 'Deep interior cleaning & conditioning', duration: '2 hours', features: ['Deep vacuum', 'Upholstery cleaning', 'Leather conditioning', 'Steam cleaning', 'Stain removal'] },
  { id: 'full', name: 'Full Detail', price: 4500, description: 'Complete interior & exterior treatment', duration: '4 hours', features: ['Everything in Executive', 'Everything in Interior', 'Clay bar treatment', 'Paint polish', 'Wax protection', 'Engine bay cleaning'] },
];

export const nairobiAreas = ['Westlands', 'Kilimani', 'CBD', 'Lavington', 'South B', 'South C', 'Karen', 'Parklands', 'Upperhill', 'Riverside'];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      users: [],
      vehicles: mockVehicles,
      stations: mockStations,
      detailers: mockDetailers,
      bookings: mockBookings,
      payments: [],
      payouts: [],
      loyaltyProgress: mockLoyalty,
      emailLogs: [],

      login: (role: UserRole) => {
        const user: User = {
          id: role === 'customer' ? 'customer' : role === 'detailer' ? 'd1' : 'admin',
          name: role === 'customer' ? 'Demo Customer' : role === 'detailer' ? 'James Mwangi' : 'Admin User',
          email: `${role}@trackwash.co.ke`,
          phone: '+254722000000',
          role,
          createdAt: new Date().toISOString(),
        };
        set({ currentUser: user, isAuthenticated: true });
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      addVehicle: (vehicle) => {
        const newVehicle = { ...vehicle, id: generateId() };
        set((state) => ({ vehicles: [...state.vehicles, newVehicle] }));
      },

      removeVehicle: (id) => {
        set((state) => ({ vehicles: state.vehicles.filter((v) => v.id !== id) }));
      },

      createBooking: (booking) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newBooking: Booking = {
          ...booking,
          id,
          createdAt: now,
          updatedAt: now,
          statusHistory: [{ status: booking.status, timestamp: now }],
        };
        set((state) => ({ bookings: [...state.bookings, newBooking] }));
        return id;
      },

      updateBookingStatus: (id, status, note) => {
        const now = new Date().toISOString();
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status,
                  updatedAt: now,
                  statusHistory: [...b.statusHistory, { status, timestamp: now, note }],
                }
              : b
          ),
        }));
      },

      cancelBooking: (id) => {
        get().updateBookingStatus(id, 'cancelled', 'Cancelled by user');
      },

      rateBooking: (id, rating) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, rating, status: 'rated', updatedAt: new Date().toISOString() } : b
          ),
        }));
      },

      tipBooking: (id, amount, method) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, tip: amount, tipMethod: method } : b
          ),
        }));
      },

      assignDetailer: (bookingId, detailerId) => {
        const detailer = get().detailers.find((d) => d.id === detailerId);
        if (detailer) {
          set((state) => ({
            bookings: state.bookings.map((b) =>
              b.id === bookingId
                ? { ...b, detailerId, detailerName: detailer.name, status: 'detailer_assigned', updatedAt: new Date().toISOString() }
                : b
            ),
          }));
          get().updateBookingStatus(bookingId, 'detailer_assigned', `Assigned to ${detailer.name}`);
        }
      },

      addPayment: (payment) => {
        const newPayment = { ...payment, id: generateId(), createdAt: new Date().toISOString() };
        set((state) => ({ payments: [...state.payments, newPayment] }));
      },

      createPayout: (payout) => {
        const newPayout = { ...payout, id: generateId(), createdAt: new Date().toISOString() };
        set((state) => ({ payouts: [...state.payouts, newPayout] }));
      },

      approvePayout: (id, reference) => {
        set((state) => ({
          payouts: state.payouts.map((p) =>
            p.id === id ? { ...p, status: 'paid', reference, paidAt: new Date().toISOString() } : p
          ),
        }));
      },

      updateLoyalty: (userId) => {
        set((state) => {
          const existing = state.loyaltyProgress.find((l) => l.userId === userId);
          if (existing) {
            const newPoints = (existing.points % 10) + 1;
            return {
              loyaltyProgress: state.loyaltyProgress.map((l) =>
                l.userId === userId
                  ? { ...l, points: newPoints, totalWashes: l.totalWashes + 1 }
                  : l
              ),
            };
          } else {
            return {
              loyaltyProgress: [...state.loyaltyProgress, { userId, points: 1, totalWashes: 1, redeemedRewards: 0 }],
            };
          }
        });
      },

      redeemReward: (userId) => {
        set((state) => ({
          loyaltyProgress: state.loyaltyProgress.map((l) =>
            l.userId === userId ? { ...l, points: 0, redeemedRewards: l.redeemedRewards + 1 } : l
          ),
        }));
      },

      updateDetailerStatus: (id, isOnline) => {
        set((state) => ({
          detailers: state.detailers.map((d) =>
            d.id === id ? { ...d, isOnline, availability: isOnline ? 'available' : 'offline' } : d
          ),
        }));
      },

      updateDetailerAvailability: (id, availability) => {
        set((state) => ({
          detailers: state.detailers.map((d) => (d.id === id ? { ...d, availability } : d)),
        }));
      },

      approveDetailer: (id) => {
        set((state) => ({
          detailers: state.detailers.map((d) => (d.id === id ? { ...d, status: 'approved' } : d)),
        }));
      },

      suspendDetailer: (id) => {
        set((state) => ({
          detailers: state.detailers.map((d) => (d.id === id ? { ...d, status: 'suspended' } : d)),
        }));
      },

      addEmailLog: (log) => {
        const newLog = { ...log, id: generateId(), sentAt: new Date().toISOString() };
        set((state) => ({ emailLogs: [...state.emailLogs, newLog] }));
      },
    }),
    {
      name: 'trackwash-storage',
    }
  )
);
