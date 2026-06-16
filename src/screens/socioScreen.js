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
    description: "Você ainda não possui uma associação vinculada à sua conta.",
    memberNumber: null,
    since: null,
    linked: false,
  },
  plan: null,
  loyalty: {
    title: "Fidelidade Savóia",
    description: "A fidelidade será calculada a partir das mensalidades pagas pelo app.",
    paidInstallments: 0,
    requiredInstallments: 12,
    progressPercent: 0,
    nextGiftLabel: null,
    giftAvailable: false,
  },
  payments: {
    title: "Pagamentos",
    description: "Acompanhe histórico, próximos lançamentos e cartões cadastrados.",
    nextChargeLabel: null,
    nextChargeDueAt: null,
    recurrenceEnabled: false,
    subscriptionStatus: null,
  },
  benefits: {
    title: "Benefícios",
    description: "Benefícios de sócio ativo ficam disponíveis após ativação ou regularização da associação.",
    availableCount: 0,
    storeDiscountPercent: 0,
    gift: null,
  },
};

function mergeSummary(data) {
  return {
    ...FALLBACK_SUMMARY,
    ...(data || {}),
    user: { ...FALLBACK_SUMMARY.user, ...(data?.user || {}) },
    statusCard: { ...FALLBACK_SUMMARY.statusCard, ...(data?.statusCard || {}) },
    association: { ...FALLBACK_SUMMARY.association, ...(data?.association || {}) },
    loyalty: { ...FALLBACK_SUMMARY.loyalty, ...(data?.loyalty || {}) },
    payments: { ...FALLBACK_SUMMARY.payments, ...(data?.payments || {}) },
    benefits: { ...FALLBACK_SUMMARY.benefits, ...(data?.benefits || {}) },
  };
}

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
      label: "Sócio inativo",
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

function formatPercent(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.round(number) : 0;
}

function ProgressBar({ percent = 0 }) {
  const safePercent = Math.max(0, Math.min(100, Math.round(Number(percent || 0))));

  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${safePercent}%` }]} />
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

function PlanCard({ plan }) {
  if (!plan) return null;

  return (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.planTitleBlock}>
          <Text style={styles.planEyebrow}>Plano atual</Text>
          <Text style={styles.planTitle}>{plan.name}</Text>
        </View>
        <View style={styles.planPriceBadge}>
          <Text style={styles.planPrice}>{plan.monthlyAmountLabel}</Text>
          <Text style={styles.planPriceSub}>mês</Text>
        </View>
      </View>

      <View style={styles.planPillsRow}>
        <Text style={styles.planPill}>{formatPercent(plan.storeDiscountPercent)}% nas lojas</Text>
        <Text style={styles.planPill}>{plan.requiredInstallmentsForGift || 12} mensalidades</Text>
      </View>

      {!!plan.giftDescription && <Text style={styles.planGift}>{plan.giftDescription}</Text>}
    </View>
  );
}

function GiftCard({ gift }) {
  if (!gift) return null;

  return (
    <View style={styles.giftCard}>
      <MaterialCommunityIcons name="gift-outline" size={28} color="#F1E6A8" />
      <View style={styles.giftTextBlock}>
        <Text style={styles.giftTitle}>Brinde disponível</Text>
        <Text style={styles.giftText}>{gift.description}</Text>
        <Text style={styles.giftFooter}>{gift.stockNotice || "Sujeito à disponibilidade em estoque."}</Text>
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
      setSummary(mergeSummary(data));
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

  const plan = summary.plan;
  const loyalty = summary.loyalty || FALLBACK_SUMMARY.loyalty;
  const payments = summary.payments || FALLBACK_SUMMARY.payments;
  const benefits = summary.benefits || FALLBACK_SUMMARY.benefits;
  const gift = benefits.gift;

  const loyaltyData = useMemo(() => {
    const paid = Number(loyalty.paidInstallments || 0);
    const total = Number(loyalty.requiredInstallments || 12);
    const percent = Number.isFinite(Number(loyalty.progressPercent))
      ? Number(loyalty.progressPercent)
      : Math.round((paid / Number(total || 1)) * 100);

    return {
      paid: Math.max(0, paid),
      total: Math.max(1, total),
      percent: Math.max(0, Math.min(100, percent)),
    };
  }, [loyalty.paidInstallments, loyalty.progressPercent, loyalty.requiredInstallments]);

  const loyaltyFooter = loyalty.giftAvailable
    ? "Brinde disponível para retirada na sede."
    : `${loyaltyData.paid}/${loyaltyData.total} mensalidades consecutivas para o brinde`;

  const paymentsFooter = payments.nextChargeLabel
    ? `Próximo lançamento: ${payments.nextChargeLabel}`
    : payments.subscriptionStatus
      ? `Assinatura: ${payments.subscriptionStatus}`
      : "Sem recorrência ativa no momento.";

  const benefitsFooter = gift
    ? "Brinde disponível na sede"
    : benefits.storeDiscountPercent
      ? `${formatPercent(benefits.storeDiscountPercent)}% de desconto nas lojas`
      : "Nenhum benefício ativo no momento.";

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
          <Text style={styles.subtitle}>Acompanhe sua associação, plano, fidelidade, pagamentos e benefícios.</Text>
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
            <PlanCard plan={plan} />
            <GiftCard gift={gift} />

            <View style={styles.loyaltyCard}>
              <View style={styles.loyaltyHeader}>
                <View>
                  <Text style={styles.loyaltyTitle}>{loyalty.title}</Text>
                  <Text style={styles.loyaltyText}>{loyalty.description}</Text>
                </View>
                <Text style={styles.loyaltyPercent}>{loyaltyData.percent}%</Text>
              </View>
              <ProgressBar percent={loyaltyData.percent} />
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
                title={payments.title}
                description={payments.description}
                footer={paymentsFooter}
                onPress={() => navigation.navigate("Payments", { initialTab: "history" })}
              />

              <InfoCard
                icon="ticket-percent-outline"
                title={benefits.title}
                description={benefits.description}
                footer={benefitsFooter}
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
  planCard: {
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: "rgba(247,250,245,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    padding: 17,
  },
  planHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  planTitleBlock: { flex: 1 },
  planEyebrow: { color: "rgba(18,61,42,0.56)", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  planTitle: { color: "#123D2A", fontSize: 22, fontWeight: "900", marginTop: 4 },
  planPriceBadge: { backgroundColor: "#0C6A3D", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, alignItems: "center" },
  planPrice: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  planPriceSub: { color: "rgba(255,255,255,0.72)", fontSize: 10, fontWeight: "800", marginTop: 1 },
  planPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  planPill: { backgroundColor: "rgba(12,106,61,0.10)", color: "#123D2A", borderRadius: 999, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: "900" },
  planGift: { color: "rgba(18,61,42,0.70)", fontSize: 13, lineHeight: 18, fontWeight: "800", marginTop: 11 },
  giftCard: {
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: "rgba(12,106,61,0.92)",
    borderWidth: 1,
    borderColor: "rgba(241,230,168,0.28)",
    padding: 16,
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
  },
  giftTextBlock: { flex: 1 },
  giftTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  giftText: { color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 18, marginTop: 4, fontWeight: "700" },
  giftFooter: { color: "#F1E6A8", fontSize: 12, lineHeight: 17, fontWeight: "900", marginTop: 6 },
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
