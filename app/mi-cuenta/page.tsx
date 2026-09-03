import type { Metadata } from 'next';
import { CustomerDashboard } from './customer-dashboard';

export const metadata: Metadata = {
  title: 'Mi cuenta | VENTAS VIP STREAMING',
};

export default function CustomerPage() {
  return <CustomerDashboard />;
}
