"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, MapPin, Package, Mail, Building2, RefreshCw, Trash2, Clock } from "lucide-react";
import Routes from "@/components/Routes";
import { RequestWithRouteOptions } from "../../../../types";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  QUOTED: "bg-purple-100 text-purple-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<RequestWithRouteOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reparsing, setReparsing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchRequest(params.id as string);
    }
  }, [params.id]);

  const fetchRequest = async (id: string) => {
    try {
      const response = await fetch(`/api/requests/${id}`);
      if (response.ok) {
        const data: RequestWithRouteOptions = await response.json();
        setRequest(data);
      } else {
        setError('Request not found');
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      setError('Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  // Background status polling when PENDING
  useEffect(() => {
    if (request?.status === 'PENDING') {
      // Simulate progress bar animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90; // Don't complete until status changes
          return prev + Math.random() * 10;
        });
      }, 1000);

      // Poll for status updates
      const statusInterval = setInterval(() => {
        if (params.id) {
          fetchRequest(params.id as string);
        }
      }, 5000); // Check every 5 seconds

      return () => {
        clearInterval(progressInterval);
        clearInterval(statusInterval);
      };
    } else {
      setProgress(0); // Reset progress when not pending
    }
  }, [request?.status, params.id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDimensions = (request: RequestWithRouteOptions) => {
    const dims = [request.length, request.width, request.height].filter(d => d != null);
    return dims.length > 0 ? `${dims.join(' × ')} cm` : 'N/A';
  };

  const handleReparse = async () => {
    if (!request) return;
    
    setReparsing(true);
    try {
      const response = await fetch(`/api/requests/${request.id}/reparse`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        setRequest(result.request);
        // Refresh the page to show updated data
        await fetchRequest(request.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to re-parse request');
      }
    } catch (error) {
      console.error('Error re-parsing request:', error);
      setError('Failed to re-parse request');
    } finally {
      setReparsing(false);
    }
  };

  const handleDelete = async () => {
    if (!request) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/requests');
      } else {
        setError('Failed to delete request');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      setError('Failed to delete request');
    } finally {
      setDeleting(false);
    }
  };

  // Simple Progress Component
  const PendingProgress = () => {
    if (request?.status !== 'PENDING') return null;

    return (
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Processing request...</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading request details...</div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-red-500 mb-4">{error || 'Request not found'}</div>
            <Button onClick={() => router.push('/requests')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button 
          onClick={() => router.push('/requests')} 
          variant="outline" 
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Request Details</h1>
            <p className="text-gray-600 mt-2">Request from {request.company}</p>
          </div>
          <div className="flex gap-2 items-center">
            {true && (
              <Button
                onClick={handleReparse}
                disabled={reparsing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${reparsing ? 'animate-spin' : ''}`} />
                {reparsing ? 'Re-parsing...' : 'Re-parse Email'}
              </Button>
            )}
            <Button
              onClick={handleDelete}
              disabled={deleting}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Badge className={statusColors[request.status as keyof typeof statusColors]}>
              {request.status}
            </Badge>
            <Badge className={priorityColors[request.priority as keyof typeof priorityColors]}>
              {request.priority}
            </Badge>
          </div>
        </div>
      </div>

      {/* Add the simple progress bar */}
      <PendingProgress />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Company</label>
                  <p className="text-sm font-semibold">{request.company}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact Email</label>
                  <p className="text-sm">{request.contactEmail || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Subject</label>
                <p className="text-sm">{request.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">From</label>
                <p className="text-sm">{request.from}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">To</label>
                <p className="text-sm">{request.to}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Received</label>
                <p className="text-sm">{formatDate(request.createdAt as unknown as string)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Shipping Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Pickup Date</label>
                  <p className="text-sm">{formatDate(request.pickupDate as unknown as string)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Delivery Date</label>
                  <p className="text-sm">{formatDate(request.deliveryDate as unknown as string)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Origin Address
                </label>
                <p className="text-sm bg-gray-50 p-2 rounded">{request.originAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Destination Address
                </label>
                <p className="text-sm bg-gray-50 p-2 rounded">{request.destinationAddress}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Dimensions</label>
                  <p className="text-sm">{formatDimensions(request)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Weight</label>
                  <p className="text-sm">{request.weight ? `${request.weight} kg` : 'N/A'}</p>
                </div>
              </div>
              {request.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Notes</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Original Email Content
              </CardTitle>
              <CardDescription>
                Raw email content as received from {request.from}
              </CardDescription>
            </CardHeader>
            <CardContent className="">
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600">Subject</label>
                <p className="text-sm font-semibold">{request.subject}</p>
              </div>
              <ScrollArea className="h-[400px] w-full rounded border p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {request.rawBody}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="mt-8">
        <Routes request={request} />
      </div>
    </div>
  );
} 