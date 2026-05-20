import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { canAccessUsers, isAdminUser, isServiceProviderUser } from '../utils/userPermissions';

const isActivePath = (pathname, href) => {
  if (href === '/') return pathname === '/' || pathname === '/index';
  return pathname === href || pathname.startsWith(`${href}/`);
};

const NavButton = ({ active, label, icon, iconName, onPress, iconOnly = false }) => {
  const iconColor = active ? '#FFFFFF' : '#D9E5FF';
  return (
    <TouchableOpacity onPress={onPress} style={[styles.navButton, iconOnly ? styles.navButtonIconOnly : null, active ? styles.navButtonActive : null]}>
      {iconOnly && iconName ? (
        <Ionicons name={iconName} size={15} color={iconColor} />
      ) : (
        <Text style={[styles.navIcon, active ? styles.navIconActive : null]}>{icon}</Text>
      )}
      <Text style={[iconOnly ? styles.mobileTabLabel : styles.navLabel, active ? styles.navLabelActive : null]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function BackofficeNavShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const adminView = isAdminUser(user);
  const providerView = isServiceProviderUser(user);

  const navItems = providerView
    ? [
        { label: 'Dashboard', href: '/', icon: 'D', iconName: 'grid-outline' },
        { label: 'Servicios', href: '/services', icon: 'S', iconName: 'briefcase-outline' },
        { label: 'Mi perfil', href: '/profile', icon: 'P', iconName: 'person-outline' },
      ]
    : [
        { label: 'Dashboard', href: '/', icon: 'D', iconName: 'grid-outline' },
        { label: adminView ? 'Propiedades' : 'Mis propiedades', href: '/properties', icon: 'I', iconName: 'home-outline' },
        { label: 'Mi perfil', href: '/profile', icon: 'P', iconName: 'person-outline' },
      ];

  if (canAccessUsers(user)) {
    navItems.splice(2, 0, { label: 'Usuarios', href: '/users', icon: 'U', iconName: 'people-outline' });
  }

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot}>
        <View style={styles.sidebar}>
          <Text style={styles.brand}>KConecta</Text>
          <View style={styles.sidebarNav}>
            {navItems.map((item) => (
              <NavButton key={item.href} active={isActivePath(pathname, item.href)} label={item.label} icon={item.icon} onPress={() => router.push(item.href)} />
            ))}
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Cerrar sesion</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.desktopContent}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.mobileRoot}>
      <View style={styles.mobileContent}>{children}</View>
      <View style={styles.mobileTabBar}>
        {navItems.map((item) => (
          <NavButton
            key={item.href}
            active={isActivePath(pathname, item.href)}
            label={item.label}
            icon={item.icon}
            iconName={item.iconName}
            iconOnly
            onPress={() => router.push(item.href)}
          />
        ))}
        <TouchableOpacity onPress={logout} style={[styles.navButton, styles.navButtonIconOnly, styles.mobileLogoutTab]}>
          <Ionicons name="log-out-outline" size={15} color="#FFFFFF" />
          <Text style={styles.mobileTabLabel}>Salir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopRoot: { flex: 1, flexDirection: 'row', backgroundColor: '#EEF3F8' },
  sidebar: {
    width: 280,
    backgroundColor: '#0F274D',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    borderRightWidth: 1,
    borderRightColor: '#16345E',
  },
  brand: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', marginBottom: 16 },
  sidebarNav: { flex: 1 },
  navButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: 'rgba(15, 35, 66, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navButtonIconOnly: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
    minHeight: 62,
    borderRadius: 16,
    paddingVertical: 8,
    flexDirection: 'column',
    gap: 4,
    borderColor: '#25457C',
    backgroundColor: '#0F2D60',
  },
  navButtonActive: { backgroundColor: '#178D9B', borderColor: '#35B9C8' },
  navLabel: { color: '#E2E8F0', fontSize: 15, fontWeight: '700' },
  navIcon: { fontSize: 12, fontWeight: '800', color: '#E2E8F0' },
  navIconActive: { color: '#FFFFFF' },
  navLabelActive: { color: '#FFFFFF' },
  logoutButton: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoutText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  desktopContent: { flex: 1 },
  mobileRoot: { flex: 1, backgroundColor: '#EEF3F8' },
  mobileTabBar: {
    backgroundColor: '#0A2654',
    borderTopWidth: 1,
    borderTopColor: '#16345E',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  mobileTabLabel: { color: '#E7EEFF', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  mobileLogoutTab: { backgroundColor: '#E2174E', borderColor: '#FF4E7C', marginRight: 0 },
  mobileContent: { flex: 1 },
});
