

# Nestify MVP — Plan de Implementación

## 1. Design System & Configuración Base
- Configurar Tailwind con los colores custom (orange, amber, teal, dark, cream, muted, border) y las fuentes (Plus Jakarta Sans, DM Sans, Syne)
- Cargar Google Fonts en `index.html` con preconnect
- Crear componentes UI base: **Button** (primary/secondary/ghost + loading), **Card**, **Input**, **Badge** (orange/teal/dark/gray), **Avatar** (con fallback a iniciales), **Skeleton**

## 2. Supabase & Autenticación
- Conectar Supabase al proyecto
- Crear el cliente Supabase y el store de auth (`authStore` con Zustand + `useAuth` hook)
- Implementar `signIn`, `signUp`, `signOut`, `signInWithGoogle` y escuchar `onAuthStateChange`
- Crear `ProtectedRoute` que redirige a `/login` si no hay sesión, y a `/onboarding` si `onboarding_completed = false`

## 3. Páginas de Auth
- **LoginPage** — Layout dos columnas (formulario en cream / panel decorativo en dark con blob naranja, frase y pills). Formulario con Google OAuth + email/contraseña
- **RegisterPage** — Mismo layout, formulario con nombre + email + contraseña. Redirige a `/onboarding` al registrarse
- **ForgotPasswordPage** — Formulario simple de email para reset de contraseña

## 4. App Layout (rutas autenticadas)
- **Sidebar desktop** (w-64, fija) con logo Nestify, navegación con íconos Lucide (Dashboard, Empleos, Beneficios, Mi perfil, Comunidad/Discord), avatar + nombre + logout abajo
- **Topbar mobile** con logo y avatar
- **Bottom nav mobile** con 4 ítems (Dashboard, Empleos, Beneficios, Perfil)
- Contenido con fondo cream y padding responsive

## 5. Rutas & Páginas Placeholder
- Configurar React Router con todas las rutas: `/` redirige según auth, páginas de auth sin layout, páginas internas con `ProtectedRoute` + `AppLayout`
- Crear placeholders para: **DashboardPage**, **JobsPage**, **JobDetailPage**, **BenefitsPage**, **ProfilePage**, **EditProfilePage**, **OnboardingPage** — cada una con título de la página centrado

## Resultado
Auth funcional al 100% (email + Google OAuth), design system aplicado, navegación completa, y páginas internas listas como placeholders para iteración futura.

