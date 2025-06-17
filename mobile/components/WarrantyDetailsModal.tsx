import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { WarrantyRequest } from '../types';

interface WarrantyDetailsModalProps {
  visible: boolean;
  warranty: WarrantyRequest | null;
  onClose: () => void;
  renderStatusText: (status: WarrantyRequest['status']) => string;
}

const WarrantyDetailsModal: React.FC<WarrantyDetailsModalProps> = ({
  visible,
  warranty,
  onClose,
  renderStatusText,
}) => {
  if (!warranty) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>פרטי אחריות</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>


            <View style={styles.modalDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={20} color={Colors.dark.primary} />
                <Text style={styles.detailLabel}> לקוח: </Text>
                <Text style={styles.detailValue}>{warranty.clientName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="hardware-chip-outline" size={20} color={Colors.dark.primary} />
                <Text style={styles.detailLabel}> מוצר: </Text>
                <Text style={styles.detailValue}>{warranty.productInfo}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color={Colors.dark.primary} />
                <Text style={styles.detailLabel}> תאריך התקנה: </Text>
                <Text style={styles.detailValue}>
                  {new Date(warranty.installationDate).toLocaleDateString('he-IL')}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color={Colors.dark.primary} />
                <Text style={styles.detailLabel}> תאריך שליחה: </Text>
                <Text style={styles.detailValue}>
                  {new Date(warranty.submissionDate).toLocaleDateString('he-IL')}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="flag-outline" size={20} color={Colors.dark.primary} />
                <Text style={styles.detailLabel}> סטאטוס: </Text>
                <Text style={[styles.detailValue, styles.statusText]}>
                  {renderStatusText(warranty.status)}
                </Text>
              </View>
            </View>

              <View style={styles.imageSection}>
                <View style={styles.imageSectionHeader}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.dark.primary} />
                  <Text style={styles.imageLabel}> חשבונית: </Text>
                </View>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: warranty.invoiceUrl}}
                    style={styles.invoiceImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
          
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.closeActionButton} onPress={onClose}>
                <Text style={styles.closeActionButtonText}>
                   סגור 
                   </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '92%',
    maxHeight: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    direction: 'rtl', 
  },
  modalScrollView: {
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    textAlign: 'right',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  modalDetails: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginLeft: 8,
    marginRight: 12,


  },
  detailValue: {
    fontSize: 16,
    color: Colors.dark.text,
    flex: 1,
    textAlign: 'left',
  },
  statusText: {
    fontWeight: 'bold',
  },
  imageSection: {
    padding: 20,
    paddingTop: 0,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginLeft: 8,
    textAlign: 'right',
  },
  imageContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  invoiceImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#fff',
  },
  actionButtons: {
    padding: 20,
    paddingTop: 10,
  },
  closeActionButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  closeActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default WarrantyDetailsModal;
