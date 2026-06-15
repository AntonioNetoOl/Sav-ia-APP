// src/screens/paymentsScreen.js
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

import { getMePaymentCards, getMePayments } from "../api/menuClient";

const SCREEN_BG = "#05271A";
const GRADIENT_COLORS = ["#083726", "#072F20", "#05271A"];
const TOP_SPACING = Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 14 : 28;

const TABS = [
  { key: "history", label: "Histórico", icon: "receipt-outline" },
  { key: "cards", label: "Cartões", icon: "credit-card-outline", iconLib: "mci" },
];

function normalizeTab(tab) {
  if (["history", "cards", "add-card"].includes(tab)) return tab;
  return "history";
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateString) {
  if (!dateString) return "Aguardando confirmação";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getPaymentStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (["confirmed", "paid", "pago", "confirmado"].includes(normalized)) return { label: "Pago", style: styles.statusPaid };
  if (["pending", "pendente"].includes(normalized)) return { label: "Pendente", style: styles.statusPending };
  if (["failed", "recused", "recusado", "falhou"].includes(normalized)) return { label: "Falhou", style: styles.statusFailed };
  return { label: status || "Indefinido", style: styles.statusNeutral };
}

function getCardExpiration(card) {
  const month = card.expMonth || card.expirationMonth || "--";
  const year = card.expYear || card.expirationYear || "----";
  return `${month}/${year}`;
}

function BackButton({ navigation }) {
  return (
    <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.72 }]}>
      <Ionicons name="arrow-back" size={21} color="#FFFFFF" />
      <Text style={styles.backText}>Voltar</Text>
    </Pressable>
  );
}

function TabButton({ tab, active, onPress }) {
  const IconComponent = tab.iconLib === "mci" ? MaterialCommunityIcons : Ionicons;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tabButton, active && styles.tabButtonActive, pressed && { opacity: 0.82 }]}>
      <IconComponent name={tab.icon} size={18} color={active ? "#F1E6A8" : "rgba(18,61,42,0.62)"} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
    </Pressable>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={42} color="rgba(12,106,61,0.72)" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

function PaymentHistory({ payments, loading, error }) {
  if (loading) return <ActivityIndicator color="#0C6A3D" style={styles.loader} />;
  if (error) return <EmptyState icon="warning-outline" title="Não foi possível carregar" description="Tente novamente em alguns instantes." />;
  if (!payments.length) return <EmptyState icon="receipt-outline" title="Nenhum pagamento encontrado" description="Quando houver mensalidades ou cobranças, elas aparecerão aqui." />;

  return payments.map((payment) => {
    const status = getPaymentStatus(payment.status);
    const dateText = payment.paidAt ? `Pago em ${formatDate(payment.paidAt)}` : formatDate(payment.paidAt);
    const subtitle = [payment.competenceLabel, dateText, payment.methodLabel].filter(Boolean).join(" · ");

    return (
      <View key={payment.id} style={styles.paymentCard}>
        <View style={styles.paymentIconWrap}>
          <Ionicons name="receipt-outline" size={24} color="#F1E6A8" />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>{payment.title || payment.description || "Pagamento Savóia"}</Text>
          <Text style={styles.paymentDate}>{subtitle}</Text>
        </View>
        <View style={styles.paymentRight}>
          <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
          <View style={[styles.statusPill, status.style]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        </View>
      </View>
    );
  });
}

function CardsList({ cards, loading, error, onAddCard }) {
  if (loading) return <ActivityIndicator color="#0C6A3D" style={styles.loader} />;
  if (error) return <EmptyState icon="warning-outline" title="Não foi possível carregar" description="Não conseguimos buscar seus cartões agora." />;
  if (!cards.length) {
    return (
      <View>
        <EmptyState icon="card-outline" title="Nenhum cartão cadastrado" description="O cadastro de cartão será liberado com a integração do gateway de pagamento." />
        <Pressable onPress={onAddCard} style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.84 }]}>
          <Text style={styles.primaryActionText}>Cadastrar cartão</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      {cards.map((card) => (
        <View key={card.id} style={styles.cardItem}>
          <View style={styles.cardBrandIcon}>
            <MaterialCommunityIcons name="credit-card-outline" size={26} color="#F1E6A8" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{card.brand || "Cartão"} final {card.last4 || "****"}</Text>
            <Text style={styles.cardSubtitle}>Validade {getCardExpiration(card)}</Text>
          </View>
          {card.isDefault && (
            <View style={styles.defaultPill}>
              <Text style={styles.defaultPillText}>Principal</Text>
            </View>
          )}
        </View>
      ))}

      <Pressable onPress={onAddCard} style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.84 }]}>
        <Text style={styles.primaryActionText}>Cadastrar novo cartão</Text>
      </Pressable>
    </View>
  );
}

function AddCardPlaceholder({ onBackToCards }) {
  return (
    <View style={styles.addCardBox}>
      <View style={styles.addCardIcon}>
        <MaterialCommunityIcons name="credit-card-plus-outline" size={38} color="#F1E6A8" />
      </View>
      <Text style={styles.addCardTitle}>Cadastro de cartão em preparação</Text>
      <Text style={styles.addCardText}>Esta área está reservada para a futura integração com gateway de pagamento. Por segurança, o app ainda não coleta número de cartão, CVV ou dados sensíveis nesta versão.</Text>
      <Pressable onPress={() => Alert.alert("Em breve", "O cadastro de cartão será liberado após a integração financeira.")} style={({ pressed }) => [styles.disabledAction, pressed && { opacity: 0.84 }]}>
        <Text style={styles.disabledActionText}>Disponível em breve</Text>
      </Pressable>
      <Pressable onPress={onBackToCards} style={({ pressed }) => [styles.secondaryAction, pressed && { opacity: 0.84 }]}>
        <Text style={styles.secondaryActionText}>Voltar para cartões</Text>
      </Pressable>
    </View>
  );
}

export default function PaymentsScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState(normalizeTab(route?.params?.initialTab));
  const [payments, setPayments] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    setError(false);
    try {
      const [paymentsResponse, cardsResponse] = await Promise.all([getMePayments(), getMePaymentCards()]);
      setPayments(Array.isArray(paymentsResponse.data) ? paymentsResponse.data : []);
      setCards(Array.isArray(cardsResponse.data) ? cardsResponse.data : []);
    } catch (_err) {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const paid = payments.filter((payment) => ["confirmed", "paid", "pago", "confirmado"].includes(String(payment.status || "").toLowerCase()));
    const totalPaid = paid.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return { paidCount: paid.length, totalPaid };
  }, [payments]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={SCREEN_BG} />
      <LinearGradient colors={GRADIENT_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F1E6A8" />}>
        <BackButton navigation={navigation} />
        <View style={styles.header}>
          <View style={styles.headerIcon}><MaterialCommunityIcons name="credit-card-outline" size={34} color="#F1E6A8" /></View>
          <Text style={styles.title}>Pagamentos</Text>
          <Text style={styles.subtitle}>Acompanhe seu histórico e seus cartões cadastrados.</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Pagos</Text><Text style={styles.summaryValue}>{summary.paidCount}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Total confirmado</Text><Text style={styles.summaryValueSmall}>{formatCurrency(summary.totalPaid)}</Text></View>
        </View>

        <View style={styles.panel}>
          {activeTab !== "add-card" && (
            <View style={styles.tabs}>{TABS.map((tab) => <TabButton key={tab.key} tab={tab} active={tab.key === activeTab} onPress={() => setActiveTab(tab.key)} />)}</View>
          )}
          <View style={styles.tabContent}>
            {activeTab === "history" && <PaymentHistory payments={payments} loading={loading} error={error} />}
            {activeTab === "cards" && <CardsList cards={cards} loading={loading} error={error} onAddCard={() => setActiveTab("add-card")} />}
            {activeTab === "add-card" && <AddCardPlaceholder onBackToCards={() => setActiveTab("cards")} />}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SCREEN_BG },
  scrollContent: { paddingTop: TOP_SPACING, paddingHorizontal: 16, paddingBottom: 34 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 10 },
  backText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  header: { alignItems: "center", paddingTop: 8, paddingBottom: 18 },
  headerIcon: { width: 68, height: 68, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(241,230,168,0.24)" },
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "900", marginTop: 14 },
  subtitle: { color: "rgba(255,255,255,0.74)", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8, maxWidth: 320 },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  summaryCard: { flex: 1, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", padding: 14 },
  summaryLabel: { color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: "800" },
  summaryValue: { color: "#F1E6A8", fontSize: 28, fontWeight: "900", marginTop: 4 },
  summaryValueSmall: { color: "#F1E6A8", fontSize: 19, fontWeight: "900", marginTop: 8 },
  panel: { borderRadius: 28, backgroundColor: "rgba(247,250,245,0.90)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", padding: 14 },
  tabs: { flexDirection: "row", gap: 8, backgroundColor: "rgba(12,106,61,0.08)", borderRadius: 18, padding: 5 },
  tabButton: { flex: 1, minHeight: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 3 },
  tabButtonActive: { backgroundColor: "#0C6A3D" },
  tabText: { color: "rgba(18,61,42,0.68)", fontSize: 11, fontWeight: "900" },
  tabTextActive: { color: "#F1E6A8" },
  tabContent: { paddingTop: 16 },
  loader: { marginVertical: 28 },
  emptyState: { borderRadius: 20, backgroundColor: "rgba(12,106,61,0.08)", alignItems: "center", padding: 24 },
  emptyTitle: { color: "#123D2A", fontSize: 17, fontWeight: "900", marginTop: 12, textAlign: "center" },
  emptyDescription: { color: "rgba(18,61,42,0.70)", fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: "center" },
  paymentCard: { minHeight: 86, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.70)", borderWidth: 1, borderColor: "rgba(12,106,61,0.14)", padding: 13, marginBottom: 11, flexDirection: "row", alignItems: "center", gap: 12 },
  paymentIconWrap: { width: 46, height: 46, borderRadius: 16, backgroundColor: "rgba(12,106,61,0.88)", alignItems: "center", justifyContent: "center" },
  paymentInfo: { flex: 1 },
  paymentTitle: { color: "#123D2A", fontSize: 15, fontWeight: "900" },
  paymentDate: { color: "rgba(18,61,42,0.60)", fontSize: 12, fontWeight: "700", marginTop: 4 },
  paymentRight: { alignItems: "flex-end" },
  paymentAmount: { color: "#123D2A", fontSize: 14, fontWeight: "900", marginBottom: 6 },
  statusPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  statusPaid: { backgroundColor: "rgba(12,106,61,0.14)" },
  statusPending: { backgroundColor: "rgba(181,132,22,0.16)" },
  statusFailed: { backgroundColor: "rgba(183,46,46,0.14)" },
  statusNeutral: { backgroundColor: "rgba(18,61,42,0.10)" },
  statusText: { color: "#123D2A", fontSize: 11, fontWeight: "900" },
  cardItem: { borderRadius: 18, backgroundColor: "rgba(255,255,255,0.70)", borderWidth: 1, borderColor: "rgba(12,106,61,0.14)", padding: 14, marginBottom: 11, flexDirection: "row", alignItems: "center", gap: 12 },
  cardBrandIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(12,106,61,0.88)", alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { color: "#123D2A", fontSize: 15, fontWeight: "900" },
  cardSubtitle: { color: "rgba(18,61,42,0.62)", fontSize: 12, fontWeight: "700", marginTop: 4 },
  defaultPill: { borderRadius: 999, backgroundColor: "rgba(12,106,61,0.12)", paddingHorizontal: 9, paddingVertical: 5 },
  defaultPillText: { color: "#0C6A3D", fontSize: 11, fontWeight: "900" },
  primaryAction: { marginTop: 12, minHeight: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#0C6A3D" },
  primaryActionText: { color: "#F1E6A8", fontSize: 14, fontWeight: "900" },
  addCardBox: { borderRadius: 22, backgroundColor: "rgba(255,255,255,0.70)", borderWidth: 1, borderColor: "rgba(12,106,61,0.14)", padding: 22, alignItems: "center" },
  addCardIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: "rgba(12,106,61,0.90)", alignItems: "center", justifyContent: "center" },
  addCardTitle: { color: "#123D2A", fontSize: 20, fontWeight: "900", marginTop: 16, textAlign: "center" },
  addCardText: { color: "rgba(18,61,42,0.72)", fontSize: 14, lineHeight: 21, marginTop: 10, textAlign: "center" },
  disabledAction: { marginTop: 18, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 18, backgroundColor: "rgba(18,61,42,0.12)" },
  disabledActionText: { color: "rgba(18,61,42,0.62)", fontSize: 14, fontWeight: "900" },
  secondaryAction: { marginTop: 12, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 18, backgroundColor: "#0C6A3D" },
  secondaryActionText: { color: "#F1E6A8", fontSize: 14, fontWeight: "900" },
});
