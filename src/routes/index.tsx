import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '@/layouts/PublicLayout';
import AdminLayout from '@/layouts/AdminLayout';
import {
  ProtectedRoute,
  RequireAdmin,
  RequireEditor,
} from '@/components/auth';
import { LoadingOverlay } from '@/components/common';

const HomePage = lazy(() => import('@/pages/public/HomePage'));
const VideosPage = lazy(() => import('@/pages/public/VideosPage'));
const BlogPage = lazy(() => import('@/pages/public/BlogPage'));
const BlogDetailPage = lazy(() => import('@/pages/public/BlogDetailPage'));
const GalleryPage = lazy(() => import('@/pages/public/GalleryPage'));
const PublicFamilyPage = lazy(() => import('@/pages/public/FamilyPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));
const MaintenancePage = lazy(() => import('@/pages/public/MaintenancePage'));

const LoginPage = lazy(() => import('@/pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminVideosPage = lazy(() => import('@/pages/admin/VideosPage'));
const AdminBlogPage = lazy(() => import('@/pages/admin/BlogPage'));
const BlogCreatePage = lazy(() => import('@/pages/admin/BlogCreatePage'));
const BlogEditPage = lazy(() => import('@/pages/admin/BlogEditPage'));
const BlogCategoryPage = lazy(() => import('@/pages/admin/BlogCategoryPage'));
const AdminGalleryPage = lazy(() => import('@/pages/admin/GalleryPage'));
const GalleryCategoryPage = lazy(
  () => import('@/pages/admin/GalleryCategoryPage'),
);
const AdminContactPage = lazy(() => import('@/pages/admin/ContactPage'));
const ContactDetailPage = lazy(() => import('@/pages/admin/ContactDetailPage'));
const FamilyPage = lazy(() => import('@/pages/admin/FamilyPage'));
const SponsorsPage = lazy(() => import('@/pages/admin/SponsorsPage'));
const SponsorCreatePage = lazy(() => import('@/pages/admin/SponsorCreatePage'));
const SponsorDetailPage = lazy(() => import('@/pages/admin/SponsorDetailPage'));
const SponsorEditPage = lazy(() => import('@/pages/admin/SponsorEditPage'));
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const UserDetailPage = lazy(() => import('@/pages/admin/UserDetailPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingOverlay />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          index
          element={
            <Lazy>
              <HomePage />
            </Lazy>
          }
        />
        <Route
          path="videos"
          element={
            <Lazy>
              <VideosPage />
            </Lazy>
          }
        />
        <Route
          path="family"
          element={
            <Lazy>
              <PublicFamilyPage />
            </Lazy>
          }
        />
        <Route
          path="blog"
          element={
            <Lazy>
              <BlogPage />
            </Lazy>
          }
        />
        <Route
          path="blog/:slug"
          element={
            <Lazy>
              <BlogDetailPage />
            </Lazy>
          }
        />
        <Route
          path="gallery"
          element={
            <Lazy>
              <GalleryPage />
            </Lazy>
          }
        />
        <Route
          path="contact"
          element={
            <Lazy>
              <ContactPage />
            </Lazy>
          }
        />
        <Route
          path="maintenance"
          element={
            <Lazy>
              <MaintenancePage />
            </Lazy>
          }
        />
      </Route>

      <Route
        path="admin/login"
        element={
          <Lazy>
            <LoginPage />
          </Lazy>
        }
      />

      <Route path="admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Lazy>
                <DashboardPage />
              </Lazy>
            }
          />
          <Route
            path="analytics"
            element={
              <Lazy>
                <AnalyticsPage />
              </Lazy>
            }
          />

          <Route element={<RequireEditor />}>
            <Route
              path="videos"
              element={
                <Lazy>
                  <AdminVideosPage />
                </Lazy>
              }
            />
            <Route
              path="blog"
              element={
                <Lazy>
                  <AdminBlogPage />
                </Lazy>
              }
            />
            <Route
              path="blog/new"
              element={
                <Lazy>
                  <BlogCreatePage />
                </Lazy>
              }
            />
            <Route
              path="blog/categories"
              element={
                <Lazy>
                  <BlogCategoryPage />
                </Lazy>
              }
            />
            <Route
              path="blog/:id/edit"
              element={
                <Lazy>
                  <BlogEditPage />
                </Lazy>
              }
            />
            <Route
              path="gallery"
              element={
                <Lazy>
                  <AdminGalleryPage />
                </Lazy>
              }
            />
            <Route
              path="gallery/categories"
              element={
                <Lazy>
                  <GalleryCategoryPage />
                </Lazy>
              }
            />
            <Route
              path="contact"
              element={
                <Lazy>
                  <AdminContactPage />
                </Lazy>
              }
            />
            <Route
              path="contact/:id"
              element={
                <Lazy>
                  <ContactDetailPage />
                </Lazy>
              }
            />
            <Route
              path="family"
              element={
                <Lazy>
                  <FamilyPage />
                </Lazy>
              }
            />
            <Route
              path="sponsors"
              element={
                <Lazy>
                  <SponsorsPage />
                </Lazy>
              }
            />
            <Route
              path="sponsors/new"
              element={
                <Lazy>
                  <SponsorCreatePage />
                </Lazy>
              }
            />
            <Route
              path="sponsors/:id"
              element={
                <Lazy>
                  <SponsorDetailPage />
                </Lazy>
              }
            />
            <Route
              path="sponsors/:id/edit"
              element={
                <Lazy>
                  <SponsorEditPage />
                </Lazy>
              }
            />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route
              path="users"
              element={
                <Lazy>
                  <UsersPage />
                </Lazy>
              }
            />
            <Route
              path="users/:id"
              element={
                <Lazy>
                  <UserDetailPage />
                </Lazy>
              }
            />
            <Route
              path="settings"
              element={
                <Lazy>
                  <SettingsPage />
                </Lazy>
              }
            />
          </Route>
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Lazy>
            <NotFoundPage />
          </Lazy>
        }
      />
    </Routes>
  );
}
