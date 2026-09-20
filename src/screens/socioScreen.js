// src/screens/socioScreen.js
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
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

import { getMemberPlans, getMemberSummary } from "../api/memberClient";
import BottomNavigation from "../components/bottomNavigation";
import { getToken } from "../utils/storage";

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

function getAssociationAction(memberStatus) {
  if (memberStatus === "socio_inativo") {
    return {
      eyebrow: "Regularização",
      title: "Regularizar associação",
      description: "Sua associação está inativa. Escolha um plano para voltar a acessar benefícios de sócio ativo quando o fluxo financeiro for liberado.",
      buttonLabel: "Ver planos disponíveis",
      alertTitle: "Regularizar associação",
      alertMessage: "A escolha de plano já usa dados reais. A próxima etapa será conectar esse fluxo à criação de assinatura/cobrança, sem gateway real por enquanto.",
    };
  }

  return {
    eyebrow: "Associação",
    title: "Conheça os planos Savóia",
    description: "Associe-se para acompanhar plano, pagamentos, benefícios e fidelidade pelo app.",
    buttonLabel: "Conhecer planos",
    alertTitle: "Associar-se",
    alertMessage: "Os planos já são carregados do backend. A próxima etapa será criar o fluxo de escolha do plano, ainda sem checkout real.",
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

function AssociationActionCard({ memberStatus, onPress }) {
  const action = getAssociationAction(memberStatus);

  return (
    <View style={styles.actionCard}>
      <View style={styles.actionIconWrap}>
        <MaterialCommunityIcons name="account-heart-outline" size={30} color="#F1E6A8" />
      </View>
      <View style={styles.actionTextBlock}>
        <Text style={styles.actionEyebrow}>{action.eyebrow}</Text>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionDescription}>{action.description}</Text>
        <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.86 }]}> 
          <Text style={styles.primaryButtonText}>{action.buttonLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color="#123D2A" />
        </Pressable>
      </View>
    </View>
  );
}

function AvailablePlanCard({ plan, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.availablePlanCard, pressed && { opacity: 0.9 }]}> 
      <View style={styles.availablePlanHeader}>
        <View style={styles.planTitleBlock}>
          <Text style={styles.planEyebrow}>Plano disponível</Text>
          <Text style={styles.availablePlanTitle}>{plan.name}</Text>
        </View>
        <View style={styles.availablePriceBadge}>
          <Text style={styles.availablePlanPrice}>{plan.monthlyAmountLabel}</Text>
          <Text style={styles.availablePlanPriceSub}>mês</Text>
        </View>
      </View>

      <View style={styles.planPillsRow}>
        <Text style={styles.planPill}>{formatPercent(plan.storeDiscountPercent)}% nas lojas</Text>
        <Text style={styles.planPill}>{plan.requiredInstallmentsForGift || 12} mensalidades</Text>
      </View>

      {!!plan.giftDescription && <Text style={styles.planGift}>{plan.giftDescription}</Text>}

      <View style={styles.availablePlanFooter}>
        <Text style={styles.availablePlanFooterText}>Selecionar plano</Text>
        <Ionicons name="chevron-forward" size={16} color="#0C6A3D" />
      </View>
    </Pressable>
  );
}

function AvailablePlansSection({ plans, plansError, onPlanPress }) {
  return (
    <View style={styles.plansSection}>
      <Text style={styles.sectionTitle}>Planos disponíveis</Text>
      <Text style={styles.sectionSubtitle}>Valores, descontos e brindes vêm do backend.</Text>

      {plansError && (
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={19} color="#9A6A13" />
          <Text style={styles.warningText}>Não foi possível carregar os planos agora.</Text>
        </View>
      )}

      {!plansError && plans.length === 0 && (
        <View style={styles.emptyPlansBox}>
          <Text style={styles.emptyPlansTitle}>Nenhum plano disponível</Text>
          <Text style={styles.emptyPlansText}>Quando a Savóia ativar planos no backend, eles aparecerão aqui.</Text>
        </View>
      )}

      {plans.map((plan) => (
        <AvailablePlanCard key={plan.code || String(plan.id)} plan={plan} onPress={() => onPlanPress(plan)} />
      ))}
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
  const [summary, setSummary] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [plansError, setPlansError] = useState(false);
  const requestId = useRef(0);

  const loadMemberArea = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setSummary(null);
    setAvailablePlans([]);
    setError(false);
    setPlansError(false);

    try {
      const session = await getToken();
      if (currentRequest !== requestId.current) return;
      if (!session) {
        setError("expired");
        return;
      }
      const [summaryResult, plansResult] = await Promise.allSettled([
        getMemberSummary(),
        getMemberPlans(),
      ]);

      const currentSession = await getToken();
      if (currentRequest !== requestId.current) return;
      if (currentSession !== session) {
        setError(currentSession ? "changed" : "expired");
        return;
      }

      if ([summaryResult, plansResult].some((result) => result.status === "rejected" && result.reason?.response?.status === 401)) {
        setError("expired");
        return;
      }

      if (summaryResult.status === "fulfilled" &&
          ["nao_socio", "socio_inativo", "socio_ativo"].includes(summaryResult.value?.data?.memberStatus)) {
        setSummary(mergeSummary(summaryResult.value?.data));
      } else {
        setError(true);
        setSummary(null);
      }

      if (plansResult.status === "fulfilled") {
        const plans = plansResult.value?.data?.plans;
        setAvailablePlans(Array.isArray(plans) ? plans : []);
      } else {
        setPlansError(true);
        setAvailablePlans([]);
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadMemberArea();
    return () => {
      requestId.current += 1;
      setSummary(null);
      setAvailablePlans([]);
      setLoading(true);
    };
  }, [loadMemberArea]));

  const onRefresh = useCallback(() => {
    if (loading) return;
    setRefreshing(true);
    loadMemberArea();
  }, [loadMemberArea, loading]);

  const plan = summary?.plan;
  const loyalty = summary?.loyalty || FALLBACK_SUMMARY.loyalty;
  const payments = summary?.payments || FALLBACK_SUMMARY.payments;
  const benefits = summary?.benefits || FALLBACK_SUMMARY.benefits;
  const gift = benefits.gift;
  const isActiveMember = summary?.memberStatus === "socio_ativo";
  const shouldShowPlanOptions = !isActiveMember;

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

  const paymentsFooter = isActiveMember
    ? payments.nextChargeLabel
      ? `Próximo lançamento: ${payments.nextChargeLabel}`
      : payments.subscriptionStatus
        ? `Assinatura: ${payments.subscriptionStatus}`
        : "Sem recorrência ativa no momento."
    : "Regularização ainda sem checkout no app.";

  const benefitsFooter = !isActiveMember
    ? "Benefícios bloqueados até ativação ou regularização."
    : gift
      ? "Brinde disponível na sede"
      : benefits.storeDiscountPercent
        ? `${formatPercent(benefits.storeDiscountPercent)}% de desconto nas lojas`
        : "Nenhum benefício ativo no momento.";

  const handleAssociationAction = useCallback(() => {
    const action = getAssociationAction(summary?.memberStatus);
    Alert.alert(action.alertTitle, action.alertMessage);
  }, [summary?.memberStatus]);

  const handlePlanPress = useCallback((selectedPlan) => {
    Alert.alert(
      selectedPlan?.name || "Plano",
      "Plano carregado do backend. A próxima etapa será criar a intenção de associação/regularização sem gateway real."
    );
  }, []);

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
          <Text style={styles.title}>Olá, {summary?.user?.name || "torcedor"}</Text>
          <Text style={styles.subtitle}>Acompanhe sua associação, plano, fidelidade, pagamentos e benefícios.</Text>
        </View>

        {loading ? (
          <ActivityIndicator accessibilityLabel="Carregando associação" color="#F1E6A8" style={styles.loading} />
        ) : error ? (
          <View>
            <View style={styles.warningBox} accessibilityRole="alert">
                <Ionicons name="warning-outline" size={19} color="#9A6A13" />
                <Text style={styles.warningText}>{error === "expired"
                  ? "Sua sessão expirou. Entre novamente para consultar sua associação."
                  : "Não foi possível carregar sua associação. Tente novamente."}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={error === "expired"
              ? () => navigation.reset({ index: 0, routes: [{ name: "Login" }] })
              : onRefresh} style={[styles.primaryButton, styles.retryButton]}>
              <Text style={styles.primaryButtonText}>{error === "expired" ? "Entrar novamente" : "Tentar novamente"}</Text>
            </Pressable>
          </View>
        ) : summary ? (
          <>
            <StatusCard summary={summary} />

            {isActiveMember ? (
              <>
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
              </>
            ) : (
              <AssociationActionCard memberStatus={summary.memberStatus} onPress={handleAssociationAction} />
            )}

            {shouldShowPlanOptions && (
              <AvailablePlansSection plans={availablePlans} plansError={plansError} onPlanPress={handlePlanPress} />
            )}

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
                onPress={() => isActiveMember
                  ? navigation.navigate("Payments", { initialTab: "history" })
                  : Alert.alert("Pagamentos", "A regularização financeira será conectada em uma etapa futura.")}
              />

              <InfoCard
                icon="ticket-percent-outline"
                title={benefits.title}
                description={benefits.description}
                footer={benefitsFooter}
                onPress={() => isActiveMember
                  ? navigation.navigate("Benefits")
                  : Alert.alert("Benefícios", "Benefícios ficam disponíveis após ativação ou regularização da associação.")}
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
        ) : null}
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
  retryButton: { minHeight: 44 },
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
  actionCard: {
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: "rgba(247,250,245,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    padding: 17,
    flexDirection: "row",
    gap: 13,
  },
  actionIconWrap: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(12,106,61,0.92)" },
  actionTextBlock: { flex: 1 },
  actionEyebrow: { color: "rgba(18,61,42,0.56)", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  actionTitle: { color: "#123D2A", fontSize: 21, fontWeight: "900", marginTop: 4 },
  actionDescription: { color: "rgba(18,61,42,0.70)", fontSize: 13, lineHeight: 19, fontWeight: "800", marginTop: 6 },
  primaryButton: { marginTop: 13, alignSelf: "flex-start", borderRadius: 999, backgroundColor: "#F1E6A8", paddingHorizontal: 14, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 7 },
  primaryButtonText: { color: "#123D2A", fontSize: 13, fontWeight: "900" },
  plansSection: { marginTop: 18 },
  sectionSubtitle: { color: "rgba(255,255,255,0.70)", fontSize: 13, lineHeight: 18, fontWeight: "700", marginTop: -4, marginBottom: 10 },
  availablePlanCard: {
    borderRadius: 22,
    backgroundColor: "rgba(247,250,245,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    padding: 15,
    marginBottom: 12,
  },
  availablePlanHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  availablePlanTitle: { color: "#123D2A", fontSize: 20, fontWeight: "900", marginTop: 4 },
  availablePriceBadge: { backgroundColor: "rgba(12,106,61,0.10)", borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8, alignItems: "center" },
  availablePlanPrice: { color: "#0C6A3D", fontSize: 14, fontWeight: "900" },
  availablePlanPriceSub: { color: "rgba(18,61,42,0.55)", fontSize: 10, fontWeight: "800", marginTop: 1 },
  availablePlanFooter: { borderTopWidth: 1, borderTopColor: "rgba(18,61,42,0.08)", marginTop: 13, paddingTop: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  availablePlanFooterText: { color: "#0C6A3D", fontSize: 13, fontWeight: "900" },
  emptyPlansBox: { borderRadius: 18, backgroundColor: "rgba(247,250,245,0.86)", padding: 14, marginBottom: 12 },
  emptyPlansTitle: { color: "#123D2A", fontSize: 15, fontWeight: "900" },
  emptyPlansText: { color: "rgba(18,61,42,0.65)", fontSize: 12, lineHeight: 17, fontWeight: "700", marginTop: 4 },
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
