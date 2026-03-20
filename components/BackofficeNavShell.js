import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Mis propiedades', href: '/properties' },
  { label: 'Usuarios', href: '/users' },
  { label: 'Mi perfil', href: '/profile' },
];

const isActivePath = (pathname, href) => {
  if (href === '/') {
    return pathname === '/' || pathname === '/index';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

const NavButton = ({ active, label, onPress, compact = false }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.navButton, active ? styles.navButtonActive : null, compact ? styles.navButtonCompact : null]}
  >
    <Text style={[styles.navLabel, active ? styles.navLabelActive : null]}>{label}</Text>
  </TouchableOpacity>
);

export default function BackofficeNavShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot}>
        <View style={styles.sidebar}>
          <Text style={styles.brand}>KConecta</Text>
          <View style={styles.sidebarNav}>
            {NAV_ITEMS.map((item) => (
              <NavButton
                key={item.href}
                active={isActivePath(pathname, item.href)}
                label={item.label}
                onPress={() => router.push(item.href)}
              />
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
      <View style={styles.mobileNavWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mobileNavContent}
        >
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.href}
              active={isActivePath(pathname, item.href)}
              label={item.label}
              compact
              onPress={() => router.push(item.href)}
            />
          ))}
          <TouchableOpacity onPress={logout} style={[styles.navButton, styles.mobileLogout]}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <View style={styles.mobileContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EEF3F8',
  },
  sidebar: {
    width: 280,
    backgroundColor: '#0F274D',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    borderRightWidth: 1,
    borderRightColor: '#16345E',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 16,
  },
  sidebarNav: {
    flex: 1,
  },
  navButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: 'rgba(15, 35, 66, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  navButtonCompact: {
    marginBottom: 0,
    marginRight: 8,
    paddingVertical: 9,
  },
  navButtonActive: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },
  navLabel: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
  },
  navLabelActive: {
    color: '#FFFFFF',
  },
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
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  desktopContent: {
    flex: 1,
  },
  mobileRoot: {
    flex: 1,
    backgroundColor: '#EEF3F8',
  },
  mobileNavWrap: {
    backgroundColor: '#0F274D',
    borderBottomWidth: 1,
    borderBottomColor: '#16345E',
  },
  mobileNavContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  mobileLogout: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
    marginRight: 0,
    paddingHorizontal: 16,
  },
  mobileContent: {
    flex: 1,
  },
});
