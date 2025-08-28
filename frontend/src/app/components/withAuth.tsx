"use client";

import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';

// Higher-Order Component for easy route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Higher-Order Component for public routes (redirects authenticated users)
export function withPublic<P extends object>(
  Component: React.ComponentType<P>
) {
  return function PublicComponent(props: P) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
