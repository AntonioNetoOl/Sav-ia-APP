// src/screens/socioScreen.js
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getMemberSummary } from "../api/memberClient";
import BottomNavigation from "../components/bottomNavigation";

const SCREEN_BG = "#05271A";
const GRADIENT_COLORS = ["#083726", "#072F20", "#05271A"];
const TOP_SPACING = Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 16 : 34;

const FALLBACK_SUMMARY = {
  user: { name: "torcedor" },
  memberStatus: "nao_socio",
  statusCard: {
    title: "Você ainda não é sócio",
    description: "Associe-se para acessar benefícios, carteirinha e programa de fidelidade.",
    actionLabel: "Conhecer associação",
  },
  association: {
    title: "Não associado",
    description: "Você ainda não possui uma associação ativa vinculada à sua conta.",
    memberNumber: null,
    since: null,
  },
  loyalty: {
    title: "Fidelidade Savóia",
    description: "A fidelidade será liberada após ativação da associação.",
    paidInstallments: 0,
    requiredInstallments: 12,
    nextBenefitLabel: "Item grátis na loja",
  },
  payments: {
    title: "Pagamentos",
    description: "Acompanhe histórico, próximos lançamentos e cartões cadastrados.",
    nextChargeLabel: null,
    recurrenceEnabled: false,
  },
  benefits: {
    title: "Benefícios",
    description: "Benefícios serão exibidos após ativação da associação.",
    availableCount: 0,
  },
};

function getStatusTheme(memberStatus) {
  if (memberStatus === "socio_ativo") {
    return {
      label: "Sócio ativo",
      icon: "shield-check-outline",
      color: "#0C6A3D",
      soft: "rgba(12,106,61,0.13)",
    };
  }

  if (memberStatus === "socio_inativo") {
    return {
      label: "Em validação",
      icon: "clock-outline",
      color: "#9A6A13",
      soft: "rgba(181,132,22,0.16)",
    };
  }

  return {
    label: "Não sócio",
    icon: "account-plus-outline",
    color: "#0C6A3D",
    soft: "rgba(12,106,61,0.10)",
  };
}

function ProgressBar({ current = 0, total = 12 }) {
  const percent = Math.max(0, Math.min(100, Math.round((Number(current) / Number(total || 1)) * 100)));

  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${percent}%` }]} />
    </View>
  );
}

function StatusCard({ summary }) {
  const theme = getStatusTheme(summary.memberStatus);

  return (
    <View style={styles.statusCard}>
      <View style={[styles.statusIcon, { backgroundColor: theme.soft }]}> 
        <MaterialCommunityIcons name={theme.icon} size={34} color={theme.color} />
      </View>
      <View style={styles.statusTextBlock}>
        <View style={[styles.statusPill, { backgroundColor: theme.soft }]}> 
          <Text style={[styles.statusPillText, { color: theme.color }]}>{theme.label}</Text>
        </View>
        <Text style={styles.statusTitle}>{summary.statusCard?.title}</Text>
        <Text style={styles.statusDescription}>{summary.statusCard?.description}</Text>
      </View>
    </View>
  );
}

function InfoCard({ icon, title, description, footer, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.infoCard, pressed && { opacity: 0.86 }]}> 
      <View style={styles.infoIconWrap}>
        <MaterialCommunityIcons name={icon} size={27} color="#F1E6A8" />
      </View>
      <View style={styles.infoTextBlock}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDescription}>{description}</Text>
        {!!footer && <Text style={styles.infoFooter}>{footer}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(18,61,42,0.42)" />
    </Pressable>
  );
}

export default function SocioScreen({ navigation }) {
  const [summary, setSummary] = useState(FALLBACK_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const loadSummary = useCallback(async () => {
    setError(false);
    try {
      const { data } = await getMemberSummary();
      setSummary({ ...FALLBACK_SUMMARY, ...(data || {}) });
    } catch (_err) {
      setError(true);
      setSummary(FALLBACK_SUMMARY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSummary();
  }, [loadSummary]);

  const loyalty = summary.loyalty || FALLBACK_SUMMARY.loyalty;
  const loyaltyFooter = `${loyalty.paidInstallments || 0}/${loyalty.requiredInstallments || 12} mensalidades para o próximo benefício`;
  const progressPercent = useMemo(() => {
    const paid = Number(loyalty.paidInstallments || 0);
    const total = Number(loyalty.requiredInstallments || 12);
    return Math.max(0, Math.min(100, Math.round((paid / total) * 100)));
  }, [loyalty.paidInstallments, loyalty.requiredInstallments]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={SCREEN_BG} />
      <LinearGradient colors={GRADIENT_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F1E6A8" />}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Área do sócio</Text>
          <Text style={styles.title}>Olá, {summary.user?.name || "torcedor"}</Text>
          <Text style={styles.subtitle}>Acompanhe sua associação, fidelidade, pagamentos e benefícios.</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#F1E6A8" style={styles.loading} />
        ) : (
          <>
            {error && (
              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={19} color="#9A6A13" />
                <Text style={styles.warningText}>Não foi possível carregar os dados atualizados. Exibindo visão padrão.</Text>
              </View>
            )}

            <StatusCard summary={summary} />

            <View style={styles.loyaltyCard}>
              <View style={styles.loyaltyHeader}>
                <View>
                  <Text style={styles.loyaltyTitle}>{loyalty.title}</Text>
                  <Text style={styles.loyaltyText}>{loyalty.description}</Text>
                </View>
                <Text style={styles.loyaltyPercent}>{progressPercent}%</Text>
              </View>
              <ProgressBar current={loyalty.paidInstallments} total={loyalty.requiredInstallments} />
              <Text style={styles.loyaltyFooter}>{loyaltyFooter}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minha área</Text>

              <InfoCard
                icon="account-badge-outline"
                title={summary.association?.title}
                description={summary.association?.description}
                footer={summary.association?.memberNumber ? `Número ${summary.association.memberNumber}` : "Dados de associação serão validados pela Savóia."}
                onPress={() => Alert.alert("Minha associação", "Detalhes completos da associação serão evoluídos na próxima etapa.")}
              />

              <InfoCard
                icon="credit-card-outline"
                title={summary.payments?.title}
                description={summary.payments?.description}
                footer={summary.payments?.nextChargeLabel ? `Próximo lançamento: ${summary.payments.nextChargeLabel}` : "Sem recorrência ativa no momento."}
                onPress={() => navigation.navigate("Payments", { initialTab: "history" })}
              />

              <InfoCard
                icon="ticket-percent-outline"
                title={summary.benefits?.title}
                description={summary.benefits?.description}
                footer={`${summary.benefits?.availableCount || 0} benefício disponível`}
                onPress={() => navigation.navigate("Benefits")}
              />

              <InfoCard
                icon="card-account-details-outline"
                title="Carteirinha"
                description="Sua carteirinha digital será vinculada ao status de associação."
                footer="Área reservada para a próxima etapa."
                onPress={() => Alert.alert("Carteirinha", "A aba Carteirinha será implementada na próxima etapa.")}
              />
            </View>
          </>
        )}
      </ScrollView>

      <BottomNavigation activeKey="socio" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SCREEN_BG },
  scrollContent: {
    paddingTop: TOP_SPACING,
    paddingHorizontal: 16,
    paddingBottom: 112,
  },
  header: { alignItems: "center", paddingBottom: 18 },
  eyebrow: { color: "#F1E6A8", fontSize: 13, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  title: { color: "#FFFFFF", fontSize: 27, fontWeight: "900", marginTop: 8, textAlign: "center" },
  subtitle: { color: "rgba(255,255,255,0.74)", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8, maxWidth: 330 },
  loading: { marginTop: 40 },
  warningBox: {
    borderRadius: 16,
    backgroundColor: "rgba(241,230,168,0.16)",
    borderWidth: 1,
    borderColor: "rgba(181,132,22,0.22)",
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningText: { flex: 1, color: "#F1E6A8", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  statusCard: {
    borderRadius: 26,
    backgroundColor: "rgba(247,250,245,0.92)",
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    flexDirection: "row",
    gap: 14,
  },
  statusIcon: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statusTextBlock: { flex: 1 },
  statusPill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10 },
  statusPillText: { fontSize: 11, fontWeight: "900" },
  statusTitle: { color: "#123D2A", fontSize: 20, fontWeight: "900" },
  statusDescription: { color: "rgba(18,61,42,0.72)", fontSize: 14, lineHeight: 20, marginTop: 6 },
  loyaltyCard: {
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: "rgba(247,250,245,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    padding: 17,
  },
  loyaltyHeader: { flexDirection: "row", justifyContent: "space-between", gap: 14 },
  loyaltyTitle: { color: "#123D2A", fontSize: 18, fontWeight: "900" },
  loyaltyText: { color: "rgba(18,61,42,0.70)", fontSize: 13, lineHeight: 18, marginTop: 5, maxWidth: 235 },
  loyaltyPercent: { color: "#0C6A3D", fontSize: 24, fontWeight: "900" },
  progressTrack: { height: 10, borderRadius: 999, backgroundColor: "rgba(12,106,61,0.12)", overflow: "hidden", marginTop: 16 },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#0C6A3D" },
  loyaltyFooter: { color: "rgba(18,61,42,0.68)", fontSize: 12, fontWeight: "800", marginTop: 9 },
  section: { marginTop: 18 },
  sectionTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", marginBottom: 10 },
  infoCard: {
    minHeight: 96,
    borderRadius: 20,
    backgroundColor: "rgba(247,250,245,0.90)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconWrap: { width: 48, height: 48, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(12,106,61,0.88)" },
  infoTextBlock: { flex: 1 },
  infoTitle: { color: "#123D2A", fontSize: 16, fontWeight: "900" },
  infoDescription: { color: "rgba(18,61,42,0.68)", fontSize: 13, lineHeight: 18, marginTop: 3 },
  infoFooter: { color: "rgba(18,61,42,0.50)", fontSize: 12, fontWeight: "800", marginTop: 6 },
});
