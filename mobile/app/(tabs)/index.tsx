import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { WarrantyService } from '../../services/WarrantyService';

export default function WarrantyFormScreen() {  // Form state
  const [clientName, setClientName] = useState('');
  const [productInfo, setProductInfo] = useState('');
  const [installationDate, setInstallationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<{
    type: 'image' | 'document';
    uri: string;
    name: string;
  } | null>(null);
    // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || installationDate;
    setShowDatePicker(false);
    setInstallationDate(currentDate);
  };
    // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };
  // Pick image from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3]
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Get file extension
        const uri = result.assets[0].uri;
        const fileExtension = uri.substring(uri.lastIndexOf('.') + 1);
        
        setInvoiceFile({
          type: 'image',
          uri: uri,
          name: `invoice_image.${fileExtension}`,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  // Take a photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your camera');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3]
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Get file extension
        const uri = result.assets[0].uri;
        const fileExtension = uri.substring(uri.lastIndexOf('.') + 1);
        
        setInvoiceFile({
          type: 'image',
          uri: uri,
          name: `invoice_camera.${fileExtension}`,
        });
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };
  // Pick PDF document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        setInvoiceFile({
          type: 'document',
          uri: result.assets[0].uri,
          name: result.assets[0].name || 'document.pdf',
        });
      }
    } catch (error) {
      console.log('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  // Submit form
  const handleSubmit = async () => {
    // Reset errors
    const newErrors = {
      clientName: '',
      productInfo: '',
      invoiceFile: ''
    };
    
    // Validate form fields
    if (!clientName) {
      newErrors.clientName = 'יש להוסיף את שם הלקוח';
    }
    
    if (!productInfo) {
      newErrors.productInfo = 'יש להוסיף את מספר הסידורי של המוצר';
    }
    
    if (!invoiceFile) {
      newErrors.invoiceFile = 'יש להעלות חשבונית - תמונה או PDF';
    }
      // Check if any errors exist
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors) {
      let errorMessage = 'יש לתקן את השדות השגויים\n';
      Object.entries(newErrors).forEach(([field, error]) => {
        if (error) {
          errorMessage += `• ${error}\n`;
        }
      });
      
      setNotification({
        type: 'error',
        message: errorMessage
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format the data for submission
      const warrantyData = {
        clientName,
        productInfo,
        installationDate: installationDate.toISOString().split('T')[0],
      };
      
      // Log submission attempt for debugging
      console.log('Attempting to submit warranty with data:', JSON.stringify({
        ...warrantyData,
        invoiceFile: invoiceFile ? {
          type: invoiceFile.type,
          name: invoiceFile.name,
          // Don't log the full URI
        } : null
      }));
      
      // Submit the warranty request with file if it exists
      let result;
      if (invoiceFile) {
        try {
          result = await WarrantyService.submitWarranty({
            ...warrantyData,
            invoiceFile: invoiceFile
          });
          console.log('Warranty submission successful:', result);
        } catch (submitError: any) {
          console.log('Warranty submission error:', submitError.message);
          throw submitError;
        }
      } else {
        // TypeScript will complain if we try to call submitWarranty without invoiceFile
        // This should not happen due to form validation, but we'll handle it
        setNotification({
          type: 'error',
          message: 'יש להעלות חשבונית - תמונה או PDF'
        });
        setIsSubmitting(false);
        return;
      }
        // Process the invoice with OCR after submission
      try {
        // Start OCR processing
        const status = await WarrantyService.processInvoice(
          invoiceFile.uri,
          warrantyData.installationDate
        );
        
        // Set notification based on the status
        if (status === 'approved') {
          setNotification({
            type: 'success',
            message: 'הטופס נשלח בהצלחה! הבקשה לאישור אחריות אושרה.'
          });
        } else if (status === 'rejected') {
          setNotification({
            type: 'error',
            message: 'הטופס נשלח בהצלחה! הבקשה לאישור אחריות נדחתה. יש לבדוק את פרטי החשבונית שהועלתה.'
          });
        } else {
          setNotification({
            type: 'info',
            message: 'הטופס נשלח בהצלחה! הבקשה לאישור אחריות נמצאת בבדיקה ידנית.'
          });
        }
      } catch (error) {
        console.log('Error processing invoice:', error);
        setNotification({
          type: 'info',
          message: 'הטופס נשלח בהצלחה! אך הייתה שגיאה בעיבוד החשבונית.'
        });
      }
      
      // Reset form
      setClientName('');
      setProductInfo('');
      setInstallationDate(new Date());
      setInvoiceFile(null);    } catch (error: any) {
      console.log('שגיאה בשליחת הטופס', error);
      
      // Detailed error message for debugging
      let detailedError = `Error: ${error.message}`;
      if (error.response) {
        detailedError += `\nStatus: ${error.response.status}`;
        if (error.response.data) {
          detailedError += `\nData: ${JSON.stringify(error.response.data)}`;
        }
      }
      
      setNotification({
        type: 'error',
        message: `שגיאה בשליחת הטופס\n${detailedError}`
      });
      
      // Show specific error types
      if (error.message.includes('Authentication failed')) {
        Alert.alert(
          'שגיאת אימות',
          'נדרש להתחבר מחדש. אנא צא מהמערכת והתחבר שוב.',
          [{ text: 'הבנתי' }]
        );
      } else if (error.message.includes('להתחבר לשרת') || error.message.includes('Network Error') || error.message.includes('timeout')) {
        Alert.alert(
          'בעיית חיבור לשרת',
          'לא ניתן ליצור קשר עם השרת. בדוק את חיבור האינטרנט שלך או נסה שוב מאוחר יותר.',
          [{ text: 'הבנתי' }]
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };
    // Clear notification after timeout
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // Clear after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <ScrollView style={styles.container}>
      {notification && (
        <View 
          style={[
            styles.notification,
            notification.type === 'success' ? styles.successNotification :
            notification.type === 'error' ? styles.errorNotification : 
            styles.infoNotification
          ]}
        >
          <Text style={styles.notificationText}>{notification.message}</Text>
          <TouchableOpacity 
            style={styles.notificationClose} 
            onPress={() => setNotification(null)}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      
      <Text style={styles.title}>תופס העלאת חשבונית</Text>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>נתוני הלקוח</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>*שם הלקוח</Text>
          <TextInput
            style={styles.input}
            value={clientName}
            onChangeText={setClientName}
            placeholder="שם מלא של הלקוח"
          />
        </View>
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>נתוני המוצר</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>*מספר סידורי של המוצר</Text>
          <TextInput
            style={styles.input}
            value={productInfo}
            onChangeText={setProductInfo}
            placeholder="הכנס מספר סידורי של המוצר"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>*תאריך התקנה</Text>
          <TouchableOpacity 
            style={styles.datePickerButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(installationDate)}</Text>
            <Ionicons name="calendar" size={24} color={Colors.dark.primary} />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={installationDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        </View>
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>העלאת חשבונית</Text>
          <Text style={styles.label}>*העלה חשבונית - תמונה\PDF</Text>
        <View style={styles.uploadButtons}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color="#fff" />
            <Text style={styles.uploadButtonText}>גלריה</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.uploadButtonText}>מצלמה</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <Ionicons name="document" size={24} color="#fff" />
            <Text style={styles.uploadButtonText}>PDF</Text>
          </TouchableOpacity>
        </View>
        
        {invoiceFile && (
          <View style={styles.filePreview}>
            <Text style={styles.filePreviewText}>
              {invoiceFile.name || 'File selected'}
            </Text>
            
            {invoiceFile.type === 'image' && (
              <Image 
                source={{ uri: invoiceFile.uri }} 
                style={styles.imagePreview} 
                resizeMode="cover"
              />
            )}
            
            {invoiceFile.type === 'document' && (
              <View style={styles.pdfPreview}>
                <Ionicons name="document-text" size={48} color={Colors.dark.primary} />
                <Text style={styles.pdfText}>PDF Document</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => setInvoiceFile(null)}
            >
              <Text style={styles.removeButtonText}>הסר</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
        <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>שלח טופס</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  notification: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  successNotification: {
    backgroundColor: '#4CAF50', // Green
  },
  errorNotification: {
    backgroundColor: '#F44336', // Red
  },
  infoNotification: {
    backgroundColor: '#2196F3', // Blue
  },
  notificationText: {
    color: '#fff',
    flex: 1,
    fontSize: 16,
  },
  notificationClose: {
    padding: 4,
  },
  title: {
    direction: "rtl",
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.dark.primary,
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    direction: "rtl",
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: 'black',
  },
  inputContainer: {
    marginBottom: 16,
    direction: "rtl",
  },
  label: {
    direction: "rtl",
    fontSize: 16,
    marginBottom: 8,
    color: Colors.dark.text,
  },
  input: {
    direction:"rtl",
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
  },
  uploadButtons: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: Colors.dark.primary,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexDirection: 'row',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  filePreview: {
    backgroundColor: '#e8e8e8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filePreviewText: {
    fontSize: 16,
    marginBottom: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
  pdfPreview: {
    alignItems: 'center',
    padding: 16,
  },
  pdfText: {
    fontSize: 16,
    color: Colors.dark.primary,
    marginTop: 8,
  },
  removeButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: Colors.dark.primary,
    padding: 16,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
