import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography } from '../components/ui';

const CONTACT = {
  email: 'info@kconecta.com',
  address: 'Josep de Tarradellas 144 - Barcelona. España',
  phone: '+34 680 22 52 98',
};

const buildLegalHtml = ({ title, content }) => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 20px; color: #0f274a; background: #f8fbff; }
      .card { max-width: 920px; margin: 0 auto; background: #fff; border: 1px solid #dce6f3; border-radius: 14px; padding: 20px; }
      h1 { margin: 0 0 12px; font-size: 24px; }
      h2 { margin: 24px 0 8px; font-size: 18px; }
      p, li { font-size: 15px; line-height: 1.6; }
      ul { padding-left: 18px; }
      .meta { margin-top: 18px; padding-top: 12px; border-top: 1px solid #e8eef7; color: #38557f; }
      .meta p { margin: 6px 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      ${content}
      <div class="meta">
        <p><strong>E-mail:</strong> ${CONTACT.email}</p>
        <p><strong>Dirección:</strong> ${CONTACT.address}</p>
        <p><strong>Teléfono:</strong> ${CONTACT.phone}</p>
      </div>
    </div>
  </body>
</html>`;

const LEGAL_DOCS = {
  privacy: {
    title: 'Política de privacidad',
    html: buildLegalHtml({
      title: 'Política de privacidad',
      content: `
        <p>En KConecta tratamos tus datos personales de forma transparente y segura, conforme a la normativa vigente.</p>
        <h2>Qué datos tratamos</h2>
        <ul>
          <li>Datos de identificación y contacto.</li>
          <li>Información de uso de la plataforma para mejorar el servicio.</li>
        </ul>
        <h2>Finalidad</h2>
        <p>Gestionar tu cuenta, prestar el servicio solicitado y atender consultas o incidencias.</p>
      `,
    }),
  },
  terms: {
    title: 'Términos y condiciones',
    html: buildLegalHtml({
      title: 'Términos y condiciones',
      content: `
        <p>El acceso y uso de KConecta implica la aceptación de estos términos y condiciones.</p>
        <h2>Uso de la plataforma</h2>
        <ul>
          <li>Debes proporcionar información veraz y actualizada.</li>
          <li>No se permite el uso fraudulento o contrario a la ley.</li>
        </ul>
        <h2>Responsabilidad</h2>
        <p>Nos reservamos el derecho de suspender cuentas que incumplan estas condiciones.</p>
      `,
    }),
  },
  accountDeletion: {
    title: 'Eliminación de cuenta',
    html: buildLegalHtml({
      title: 'Eliminación de cuenta',
      content: `
        <p>Puedes solicitar la eliminación de tu cuenta en cualquier momento desde la app.</p>
        <h2>Proceso</h2>
        <ul>
          <li>Confirma tu contraseña para validar la solicitud.</li>
          <li>La eliminación puede ser irreversible según el estado de tu cuenta.</li>
        </ul>
        <h2>Soporte</h2>
        <p>Si necesitas ayuda adicional, contáctanos a través de los datos indicados abajo.</p>
      `,
    }),
  },
};

export default function LegalViewerScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();

  const doc = useMemo(() => {
    const key = Array.isArray(type) ? type[0] : type;
    return LEGAL_DOCS[key] || LEGAL_DOCS.privacy;
  }, [type]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#0E2A55" />
        </Pressable>
        <Text style={styles.title}>{doc.title}</Text>
      </View>

      <WebView source={{ html: doc.html }} originWhitelist={["*"]} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF2',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7E1ED',
    backgroundColor: '#F7FAFF',
  },
  title: {
    ...typography.h3,
    color: '#0E2A55',
    flex: 1,
  },
});
