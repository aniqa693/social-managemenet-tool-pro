'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'creator' as 'creator' | 'analyst',
    credits: 0,
  });
  const [touched, setTouched] = useState({
    email: false,
  });

  // Debounce email check
  useEffect(() => {
    const checkEmailTimeout = setTimeout(() => {
      if (formData.email && touched.email) {
        checkEmailAvailability(formData.email);
      }
    }, 500);

    return () => clearTimeout(checkEmailTimeout);
  }, [formData.email, touched.email]);

  const checkEmailAvailability = async (email: string) => {
    if (!email) return;
    
    setEmailChecking(true);
    try {
      const response = await fetch(`/api/admin/users/create?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok) {
        setEmailAvailable(!data.exists);
      } else {
        setEmailAvailable(null);
      }
    } catch (error) {
      setEmailAvailable(null);
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Double-check email availability before submission
    const checkResponse = await fetch(`/api/admin/users/create?email=${encodeURIComponent(formData.email)}`);
    const checkData = await checkResponse.json();
    
    if (checkData.exists) {
      toast.error('This email is already registered');
      setEmailAvailable(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('User created successfully');
        router.push('/admin/users');
      } else {
        if (response.status === 409) {
          toast.error('Email already exists');
          setEmailAvailable(false);
        } else {
          toast.error(data.error || 'Failed to create user');
        }
      }
    } catch (error) {
      toast.error('Error creating user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credits' ? parseInt(value) || 0 : value
    }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isFormValid = () => {
    if (!formData.name || !formData.email || !formData.role) return false;
    if (emailChecking) return false;
    if (emailAvailable === false) return false;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return false;
    
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/admin/users"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Users
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
          </div>
          <p className="text-gray-600 mt-2">Add a new creator or analyst to the system</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>

            {/* Email Field with Availability Check */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10 ${
                    touched.email && formData.email
                      ? emailAvailable === true
                        ? 'border-green-500'
                        : emailAvailable === false
                        ? 'border-red-500'
                        : 'border-gray-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {touched.email && formData.email && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {emailChecking ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    ) : emailAvailable === true ? (
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : emailAvailable === false ? (
                      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : null}
                  </div>
                )}
              </div>
              {touched.email && formData.email && (
                <p className={`mt-2 text-sm ${
                  emailAvailable === true
                    ? 'text-green-600'
                    : emailAvailable === false
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}>
                  {emailAvailable === true
                    ? '✓ Email is available'
                    : emailAvailable === false
                    ? '✗ This email is already registered'
                    : emailChecking
                    ? 'Checking email availability...'
                    : ''}
                </p>
              )}
              {!touched.email && formData.email && !emailAvailable && (
                <p className="mt-2 text-sm text-gray-500">
                  We'll check email availability when you finish typing
                </p>
              )}
            </div>

            {/* Role Field */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                User Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="creator">Creator</option>
                <option value="analyst">Analyst</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Creators can upload content, analysts can view analytics and reports
              </p>
            </div>

            {/* Credits Field */}
            <div>
              <label htmlFor="credits" className="block text-sm font-medium text-gray-700 mb-2">
                Initial Credits
              </label>
              <input
                type="number"
                id="credits"
                name="credits"
                min="0"
                value={formData.credits}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
              <p className="mt-2 text-sm text-gray-500">
                Credits can be used for various actions in the platform
              </p>
            </div>

            {/* Form Actions */}
            <div className="pt-4 flex items-center justify-end gap-4 border-t">
              <Link
                href="/admin/users"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="bg-blue-50 p-4 border-t border-blue-100">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>New users will have immediate access based on their role</li>
                  <li>Users can reset their password through the forgot password flow</li>
                  <li>Credits can be adjusted later from the user management page</li>
                  <li>Email cannot be changed after creation (contact admin for changes)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}