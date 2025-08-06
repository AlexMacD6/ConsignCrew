import React from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Trash2,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Database,
  FileText,
  Lock,
} from "lucide-react";
import Link from "next/link";

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span>← Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">
                Data Privacy
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Data Deletion Request
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We respect your privacy and provide you with full control over your
            personal data. Learn how to request deletion of your data from
            TreasureHub.
          </p>
        </div>

        {/* What Data We Collect */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              What Data We Collect
            </CardTitle>
            <CardDescription>
              Information we collect and store about you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Account Information
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <User className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span>Name and email address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span>Phone number (optional)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span>Profile information</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Activity Data</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span>Product listings and photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Database className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span>Transaction history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span>Saved items and preferences</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Request Deletion */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              How to Request Data Deletion
            </CardTitle>
            <CardDescription>
              Simple steps to request deletion of your personal data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Method 1: Email Request
                  </h4>
                  <p className="text-gray-600 mb-3">
                    Send us an email with your deletion request. Include your
                    email address and any specific data you'd like deleted.
                  </p>
                  <Button asChild>
                    <a href="mailto:support@treasurehub.club?subject=Data Deletion Request">
                      Send Deletion Request Email
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Method 2: Account Settings
                  </h4>
                  <p className="text-gray-600 mb-3">
                    Log into your account and use the built-in data deletion
                    feature in your profile settings.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/profile">Go to Profile Settings</Link>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                <div className="bg-purple-100 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Method 3: Contact Form
                  </h4>
                  <p className="text-gray-600 mb-3">
                    Use our contact form to submit a formal data deletion
                    request.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/contact">Contact Support</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Happens After Request */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              What Happens After Your Request
            </CardTitle>
            <CardDescription>
              Our process for handling data deletion requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">
                  1
                </Badge>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Request Received
                  </h4>
                  <p className="text-sm text-gray-600">
                    We'll acknowledge your request within 24 hours and provide a
                    reference number.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">
                  2
                </Badge>
                <div>
                  <h4 className="font-semibold text-gray-900">Verification</h4>
                  <p className="text-sm text-gray-600">
                    We'll verify your identity to ensure the request is
                    legitimate and authorized.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">
                  3
                </Badge>
                <div>
                  <h4 className="font-semibold text-gray-900">Data Deletion</h4>
                  <p className="text-sm text-gray-600">
                    We'll permanently delete your data from our systems within
                    30 days.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">
                  4
                </Badge>
                <div>
                  <h4 className="font-semibold text-gray-900">Confirmation</h4>
                  <p className="text-sm text-gray-600">
                    You'll receive confirmation once your data has been
                    successfully deleted.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Legal Requirements
                  </h4>
                  <p className="text-sm text-gray-600">
                    Some data may be retained for legal, accounting, or security
                    purposes as required by law.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Processing Time
                  </h4>
                  <p className="text-sm text-gray-600">
                    Data deletion requests are processed within 30 days as
                    required by privacy regulations.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Third-Party Services
                  </h4>
                  <p className="text-sm text-gray-600">
                    We'll also request deletion from third-party services we use
                    (payment processors, analytics, etc.).
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-600" />
              Contact Our Privacy Team
            </CardTitle>
            <CardDescription>
              Get in touch with our privacy team for any questions about data
              deletion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Email</h4>
                <p className="text-gray-600 mb-1">support@treasurehub.club</p>
                <p className="text-sm text-gray-500">
                  For data deletion requests and privacy questions
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Response Time
                </h4>
                <p className="text-gray-600 mb-1">Within 24 hours</p>
                <p className="text-sm text-gray-500">
                  We aim to respond to all requests promptly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            This page complies with Facebook's data deletion requirements and
            privacy regulations.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link
              href="/privacy-policy"
              className="text-sm text-blue-600 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-sm text-blue-600 hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-sm text-blue-600 hover:underline"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
