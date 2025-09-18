#!/bin/bash

# SimpleSquad Firebase Deployment Script
# Run this script to deploy your app to Firebase Hosting

echo "🔥 SimpleSquad Firebase Deployment"
echo "=================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

echo "✅ Firebase CLI ready"

# Check if user is logged in
echo "🔐 Checking Firebase authentication..."

# Try to list projects (this will fail if not logged in)
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "   firebase login"
    echo "   Then run this script again."
    exit 1
fi

echo "✅ Firebase authentication confirmed"

# Validate Firebase project
echo "🔍 Validating Firebase project..."
if ! firebase use --project simplesquad-d2b96 &> /dev/null; then
    echo "❌ Could not set Firebase project. Please check:"
    echo "   1. Project ID 'simplesquad-d2b96' exists"
    echo "   2. You have access to this project"
    exit 1
fi

echo "✅ Firebase project validated"

# Deploy Firestore rules first
echo "📋 Deploying Firestore security rules..."
if firebase deploy --only firestore:rules; then
    echo "✅ Firestore rules deployed successfully"
else
    echo "⚠️  Firestore rules deployment failed, continuing with hosting..."
fi

# Deploy Firestore indexes
echo "📊 Deploying Firestore indexes..."
if firebase deploy --only firestore:indexes; then
    echo "✅ Firestore indexes deployed successfully"
else
    echo "⚠️  Firestore indexes deployment failed, continuing with hosting..."
fi

# Deploy hosting
echo "🌐 Deploying to Firebase Hosting..."
if firebase deploy --only hosting; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================="
    echo ""
    echo "🔗 Your app is live at:"
    echo "   https://simplesquad-d2b96.web.app"
    echo "   https://simplesquad-d2b96.firebaseapp.com"
    echo ""
    echo "📊 Next steps:"
    echo "   1. Test your live app"
    echo "   2. Set up custom domain (optional)"
    echo "   3. Configure monitoring"
    echo ""
    echo "🔥 Firebase Console:"
    echo "   https://console.firebase.google.com/project/simplesquad-d2b96"
    echo ""
else
    echo "❌ Deployment failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi