import { redirect } from 'next/navigation';

export default function UsersRoot() {
  redirect('/users/dashboard');
  return null;
} 