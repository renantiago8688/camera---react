import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, ALUNO_ID } from '../firebase/config';

type Chamado = {
  description: string;
  photoUri?: string | null;
  address?: string | null;
  status: string;
};

export default function CallDetailScreen({ route }: any) {
  const { chamadoId } = route.params;

  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // ==============================
  // CARREGAR DADOS DO CHAMADO
  // ==============================
  useEffect(() => {
    async function carregarChamado() {
      setLoading(true);
      try {
        const chamadoRef = doc(db, 'alunos', ALUNO_ID, 'chamados', chamadoId);
        const snapshot = await getDoc(chamadoRef);

        if (snapshot.exists()) {
          setChamado(snapshot.data() as Chamado);
        } else {
          Alert.alert('Erro', 'Chamado não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao carregar chamado:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do chamado.');
      } finally {
        setLoading(false);
      }
    }

    carregarChamado();
  }, [chamadoId]);

  // ==============================
  // ATUALIZAR STATUS DO CHAMADO
  // ==============================
  async function mudarStatus(novoStatus: string) {
    setUpdating(true);
    try {
      const chamadoRef = doc(db, 'alunos', ALUNO_ID, 'chamados', chamadoId);

      // Atualiza apenas o campo status no Firestore
      await updateDoc(chamadoRef, { status: novoStatus });

      // Atualiza o estado local para refletir na UI imediatamente
      setChamado((prev) => (prev ? { ...prev, status: novoStatus } : null));

      Alert.alert('Sucesso', 'Status do chamado atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      Alert.alert('Erro', 'Não foi possível alterar o status. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  }

  // Helper para formatar o texto legível do status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'atendendo':
        return 'Em Atendimento';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      case 'aberto':
      default:
        return 'Aberto';
    }
  };

  // Helper para cor dinamica do badge de status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'atendendo':
        return '#0288d1';
      case 'concluido':
        return '#2e7d32';
      case 'cancelado':
        return '#c62828';
      default:
        return '#e65100';
    }
  };

  // ==============================
  // RENDERIZAÇÃO / LOADING
  // ==============================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Carregando chamado...</Text>
      </View>
    );
  }

  if (!chamado) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Chamado não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* FOTO (SE HOUVER) */}
      {chamado.photoUri ? (
        <Image source={{ uri: chamado.photoUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>Sem foto anexada</Text>
        </View>
      )}

      {/* CARD COM INFORMAÇÕES */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>STATUS</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor(chamado.status) }]}>
            <Text style={styles.badgeText}>{getStatusLabel(chamado.status)}</Text>
          </View>
        </View>

        <Text style={styles.label}>DESCRIÇÃO</Text>
        <Text style={styles.value}>{chamado.description}</Text>

        {chamado.address && (
          <>
            <Text style={styles.label}>LOCALIZAÇÃO</Text>
            <Text style={styles.value}>📍 {chamado.address}</Text>
          </>
        )}
      </View>

      {/* AÇÕES DE MUDANÇA DE STATUS */}
      <View style={styles.actionsContainer}>
        {/* BOTÃO: INICIAR ATENDIMENTO */}
        {chamado.status !== 'atendendo' && (
          <TouchableOpacity
            style={[styles.button, styles.atendendoButton, updating && styles.disabledButton]}
            disabled={updating}
            onPress={() => mudarStatus('atendendo')}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Atendimento</Text>
            )}
          </TouchableOpacity>
        )}

        {/* BOTÃO: CONCLUIR ATENDIMENTO */}
        {chamado.status !== 'concluido' && (
          <TouchableOpacity
            style={[styles.button, styles.concluidoButton, updating && styles.disabledButton]}
            disabled={updating}
            onPress={() => mudarStatus('concluido')}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Concluir Atendimento</Text>
            )}
          </TouchableOpacity>
        )}

        {/* BOTÃO: CANCELAR CHAMADO */}
        {chamado.status !== 'cancelado' && (
          <TouchableOpacity
            style={[styles.button, styles.canceladoButton, updating && styles.disabledButton]}
            disabled={updating}
            onPress={() => mudarStatus('cancelado')}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Cancelar Chamado</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

// ==============================
// ESTILOS (Padronizados com a CallListScreen / NewCallScreen)
// ==============================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    color: '#888',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginBottom: 16,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    color: '#777',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#888',
    fontWeight: 'bold',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
    lineHeight: 22,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  actionsContainer: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  atendendoButton: {
    backgroundColor: '#0288d1',
  },
  concluidoButton: {
    backgroundColor: '#2e7d32',
  },
  canceladoButton: {
    backgroundColor: '#c62828',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});