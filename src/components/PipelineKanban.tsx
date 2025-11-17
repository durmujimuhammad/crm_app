'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Pipeline {
  id: number
  stage: string
  lead: {
    customer: {
      name: string
      company?: string
    }
  }
  quotations: Array<{
    amount: number
    status: string
  }>
}

const stages = [
  { key: 'LEAD', label: 'Lead', color: 'bg-blue-100 border-blue-300' },
  { key: 'PROSPECT', label: 'Prospek', color: 'bg-yellow-100 border-yellow-300' },
  { key: 'DEAL', label: 'Deal', color: 'bg-green-100 border-green-300' },
  { key: 'WON', label: 'Menang', color: 'bg-emerald-100 border-emerald-300' },
  { key: 'LOST', label: 'Kalah', color: 'bg-red-100 border-red-300' },
]

export default function PipelineKanban() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPipelines()
  }, [])

  const fetchPipelines = async () => {
    try {
      const response = await fetch('/api/pipeline')
      const data = await response.json()
      setPipelines(data)
    } catch (error) {
      toast.error('Gagal memuat pipeline')
    } finally {
      setLoading(false)
    }
  }

  const updateStage = async (pipelineId: number, newStage: string) => {
    try {
      const response = await fetch(`/api/pipeline/${pipelineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (!response.ok) throw new Error('Failed to update')

      toast.success('Pipeline berhasil diupdate')
      fetchPipelines()
    } catch (error) {
      toast.error('Gagal mengupdate pipeline')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map(stage => {
        const stagePipelines = pipelines.filter(p => p.stage === stage.key)
        
        return (
          <div key={stage.key} className="flex-shrink-0 w-80">
            <div className={`${stage.color} border-2 rounded-lg p-4`}>
              <h3 className="font-semibold mb-3">
                {stage.label} ({stagePipelines.length})
              </h3>
              
              <div className="space-y-3">
                {stagePipelines.map(pipeline => {
                  const latestQuotation = pipeline.quotations[0]
                  
                  return (
                    <div key={pipeline.id} className="bg-white p-4 rounded-lg shadow-sm">
                      <h4 className="font-medium">{pipeline.lead.customer.name}</h4>
                      {pipeline.lead.customer.company && (
                        <p className="text-sm text-gray-600">{pipeline.lead.customer.company}</p>
                      )}
                      {latestQuotation && (
                        <p className="text-sm font-semibold text-primary-600 mt-2">
                          {formatCurrency(latestQuotation.amount)}
                        </p>
                      )}
                      
                      <select
                        value={pipeline.stage}
                        onChange={(e) => updateStage(pipeline.id, e.target.value)}
                        className="mt-3 text-xs input py-1"
                      >
                        {stages.map(s => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
