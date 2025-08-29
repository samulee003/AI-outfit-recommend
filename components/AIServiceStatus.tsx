import React, { useState, useEffect } from 'react';
import { getAIServiceInfo } from '../services/geminiService';

interface ServiceInfo {
  type: 'gemini-direct' | 'vertex-ai' | 'mock';
  status: string;
}

export const AIServiceStatus: React.FC = () => {
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const info = await getAIServiceInfo();
        setServiceInfo(info);
      } catch (error) {
        console.error('Failed to get AI service info:', error);
        setServiceInfo({ type: 'mock', status: 'Error' });
      } finally {
        setLoading(false);
      }
    };

    checkServiceStatus();
  }, []);

  if (loading) {
    return (
      <div className="ai-service-status loading">
        <span className="status-indicator">⏳</span>
        <span>檢查 AI 服務狀態...</span>
      </div>
    );
  }

  if (!serviceInfo) {
    return null;
  }

  const getStatusIcon = (type: string, status: string) => {
    if (status === 'Connected') {
      switch (type) {
        case 'vertex-ai': return '🌟';
        case 'gemini-direct': return '🚀';
        case 'mock': return '🎭';
        default: return '✅';
      }
    }
    return '❌';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Connected': return '#10b981';
      case 'Error': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getServiceName = (type: string) => {
    switch (type) {
      case 'vertex-ai': return 'Vertex AI';
      case 'gemini-direct': return 'Gemini Direct';
      case 'mock': return '模擬服務';
      default: return type;
    }
  };

  const getServiceDescription = (type: string) => {
    switch (type) {
      case 'vertex-ai': return '使用 Google Cloud Vertex AI (繞過地理限制)';
      case 'gemini-direct': return '直接使用 Gemini API';
      case 'mock': return '開發模式 - 模擬 AI 回應';
      default: return '';
    }
  };

  return (
    <div className="ai-service-status">
      <div className="status-header">
        <span className="status-indicator">
          {getStatusIcon(serviceInfo.type, serviceInfo.status)}
        </span>
        <div className="status-info">
          <div className="service-name">
            {getServiceName(serviceInfo.type)}
          </div>
          <div className="service-description">
            {getServiceDescription(serviceInfo.type)}
          </div>
        </div>
        <div 
          className="status-badge"
          style={{ backgroundColor: getStatusColor(serviceInfo.status) }}
        >
          {serviceInfo.status}
        </div>
      </div>

      <style jsx>{`
        .ai-service-status {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 16px 0;
          font-size: 14px;
        }

        .ai-service-status.loading {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
        }

        .status-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-indicator {
          font-size: 20px;
        }

        .status-info {
          flex: 1;
        }

        .service-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .service-description {
          color: #64748b;
          font-size: 12px;
        }

        .status-badge {
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};