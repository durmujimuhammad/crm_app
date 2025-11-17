'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const customerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  segment: z.string().optional(),
  type: z.enum(['LEAD', 'PROSPECT', 'CUSTOMER']),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>
  onSuccess?: () => void
  customerId?: number
}

export default function CustomerForm({ initialData, onSuccess, customerId }: CustomerFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData,
  })

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const url = customerId ? `/api/customers/${customerId}` : '/api/customers'
      const method = customerId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save customer')

      toast.success(customerId ? 'Customer berhasil diupdate' : 'Customer berhasil ditambahkan')
      onSuccess?.()
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Nama *</label>
        <input
          {...register('name')}
          className="input"
          placeholder="Nama pelanggan"
        />
        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="label">Email</label>
        <input
          {...register('email')}
          type="email"
          className="input"
          placeholder="email@example.com"
        />
        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="label">Telepon</label>
        <input
          {...register('phone')}
          className="input"
          placeholder="08123456789"
        />
      </div>

      <div>
        <label className="label">Perusahaan</label>
        <input
          {...register('company')}
          className="input"
          placeholder="Nama perusahaan"
        />
      </div>

      <div>
        <label className="label">Segmen</label>
        <select {...register('segment')} className="input">
          <option value="">Pilih segmen</option>
          <option value="Enterprise">Enterprise</option>
          <option value="SME">SME</option>
          <option value="Retail">Retail</option>
        </select>
      </div>

      <div>
        <label className="label">Tipe *</label>
        <select {...register('type')} className="input">
          <option value="LEAD">Lead</option>
          <option value="PROSPECT">Prospek</option>
          <option value="CUSTOMER">Customer</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary w-full"
      >
        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  )
}
