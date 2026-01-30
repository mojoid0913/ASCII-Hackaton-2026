import { useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { Button, Checkbox } from "react-native-paper";
import { router } from "expo-router";
import Slider from "@react-native-community/slider";
import * as Contacts from "expo-contacts";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PRIVACY_DESCRIPTIONS } from "@/constants/policies";


const TOTAL_STEPS = 3;

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Step 1: 글씨 크기
  const [fontSize, setFontSize] = useState(18);
  
  // Step 2: 보호자 설정
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedGuardians, setSelectedGuardians] = useState<string[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  
  // Step 3: 개인정보 동의
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyExpanded, setPrivacyExpanded] = useState(false);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 완료 시 데이터 저장
      console.log("Selected Font Size:", fontSize);
      console.log("Selected Guardians:", selectedGuardians);
      console.log("Privacy Agreed:", privacyAgreed);
      
      // TODO: AsyncStorage에 저장
      router.back();
    }
  };

  const toggleGuardian = (id: string) => {
    setSelectedGuardians((prev) =>
      prev.includes(id) ? prev.filter((gId) => gId !== id) : [...prev, id]
    );
  };

  const requestContactPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      // 전화번호가 있는 연락처만 필터링하여 변환
      const loadedContacts: Contact[] = data
        .filter((contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact) => ({
          id: contact.id ?? String(Math.random()),
          name: contact.name ?? "이름 없음",
          phoneNumber: contact.phoneNumbers?.[0]?.number ?? "",
        }));

      setContacts(loadedContacts);
      setContactsLoaded(true);
    } else {
      // 권한 거부 시에도 상태 업데이트
      console.log("연락처 권한이 거부되었습니다");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.title}>
              글씨 크기
            </ThemedText>
            <ThemedText style={styles.description}>
              아래의 동그라미를 움직여 보기 편한 글씨 크기로 조절하세요
            </ThemedText>

            {/* 예시 텍스트 */}
            <View style={styles.fontPreviewBox}>
              <ThemedText style={[styles.fontPreview, { fontSize }]}>
                가나다라
              </ThemedText>
              {/* <ThemedText style={styles.fontSizeLabel}>
                {fontSize}pt
              </ThemedText> */}
            </View>

            {/* 슬라이더 */}
            <View style={styles.sliderContainer}>
              <ThemedText style={styles.sliderLabel}>작게</ThemedText>
              <View style={styles.sliderWrapper}>
                <Slider
                  minimumValue={14}
                  maximumValue={34}
                  step={0.5}
                  value={fontSize}
                  onValueChange={setFontSize}
                  minimumTrackTintColor="#6200ee"
                  maximumTrackTintColor="#ccc"
                  thumbTintColor="#6200ee"
                  style={{ flex: 1 }}
                />
              </View>
              <ThemedText style={styles.sliderLabel}>크게</ThemedText>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.title}>
              보호자 설정
            </ThemedText>
            <ThemedText style={styles.description}>
              보이스피싱으로 의심되는 문자가 올 경우{"\n"}
              연락할 보호자를 선택하세요
            </ThemedText>

            {/* 연락처 접근 버튼 */}
            <Button
              mode="outlined"
              onPress={requestContactPermission}
              style={styles.contactButton}
            >
              연락처에서 가져오기
            </Button>

            {contactsLoaded ? (
              <>
                <ScrollView style={styles.contactList}>
                  {contacts.map((contact) => (
                    <TouchableOpacity
                      key={contact.id}
                      style={styles.contactItem}
                      onPress={() => toggleGuardian(contact.id)}
                    >
                      <Checkbox
                        status={
                          selectedGuardians.includes(contact.id)
                            ? "checked"
                            : "unchecked"
                        }
                        onPress={() => toggleGuardian(contact.id)}
                      />
                      <View style={styles.contactInfo}>
                        <ThemedText style={styles.contactName}>
                          {contact.name}
                        </ThemedText>
                        <ThemedText style={styles.contactPhone}>
                          {contact.phoneNumber}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {selectedGuardians.length === 0 && (
                  <ThemedText style={styles.warningMessage}>
                    ⚠️ 연락처에 최소 한 명은 등록해야해요
                  </ThemedText>
                )}

                <ThemedText style={styles.selectedCount}>
                  {selectedGuardians.length}명 선택됨
                </ThemedText>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyMessage}>
                  연락처를 가져와야 해요
                </ThemedText>
              </View>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <ThemedText type="title" style={styles.title}>
              개인정보 보호
            </ThemedText>
            <ThemedText style={styles.description}>
              안전한 서비스 이용을 위해 동의해주세요
            </ThemedText>

            {/* 개인정보 처리방침 버튼 */}
            <TouchableOpacity
              style={styles.privacyButton}
              onPress={() => setPrivacyExpanded(!privacyExpanded)}
            >
              <ThemedText style={styles.privacyButtonText}>
                📄 개인정보 처리방침 {privacyExpanded ? "▼" : "▶"}
              </ThemedText>
            </TouchableOpacity>

            {/* 개인정보 처리방침 내용 */}
            {privacyExpanded && (
              <ScrollView style={styles.privacyTextContainer}>
                <View style={styles.privacyBox}>
                  <ThemedText style={styles.privacyText}>
                    {PRIVACY_DESCRIPTIONS.content}
                  </ThemedText>
                </View>
              </ScrollView>
            )}

            {/* 동의 체크박스 */}
            <TouchableOpacity
              style={styles.agreeContainer}
              onPress={() => setPrivacyAgreed(!privacyAgreed)}
            >
              <Checkbox
                status={privacyAgreed ? "checked" : "unchecked"}
                onPress={() => setPrivacyAgreed(!privacyAgreed)}
              />
              <ThemedText style={styles.agreeText}>
                개인정보 처리방침에 동의합니다
              </ThemedText>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const isNextEnabled = () => {
    switch (currentStep) {
      case 0:
        return true; // 글씨 크기는 항상 활성화
      case 1:
        return selectedGuardians.length > 0; // 보호자 1명 이상 선택
      case 2:
        return privacyAgreed; // 개인정보 동의 필수
      default:
        return true;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>{renderStepContent()}</View>

      {/* 페이지 인디케이터 */}
      <View style={styles.indicatorContainer}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.indicator,
              index === currentStep && styles.indicatorActive,
            ]}
            onPress={() => {
              // 현재 단계보다 뒤의 단계로는 이동 불가
              if (index <= currentStep) {
                setCurrentStep(index);
              }
            }}
            disabled={index > currentStep}
          />
        ))}
      </View>

      {/* 다음으로 버튼 */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!isNextEnabled()}
          style={[
            styles.button,
            !isNextEnabled() && styles.buttonDisabled,
          ]}
        >
          {currentStep < TOTAL_STEPS - 1 ? "다음으로" : "계속하기"}
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: "15%",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  description: {
    marginBottom: 30,
    opacity: 0.7,
    textAlign: "center",
    fontSize: 16,
  },

  // Step 1: 글씨 크기
  fontPreviewBox: {
    backgroundColor: "#E8F4FF",
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 50,
    marginBottom: 30,
  },
  fontPreview: {
    fontWeight: "600",
    marginBottom: 10,
  },
  fontSizeLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingHorizontal: 10,
  },
  sliderWrapper: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 5
  },
  sliderLabel: {
    fontSize: 18,
    opacity: 0.6,
    paddingHorizontal: 15,
  },

  // Step 2: 보호자 설정
  contactButton: {
    marginBottom: 20,
    marginHorizontal: 30,
  },
  contactList: {
    flex: 1,
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginLeft: 15,
  },
  contactInfo: {
    marginLeft: "auto",
    alignItems: "flex-end",
    marginRight: 30,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 0.5,
    marginTop: 10,
    color: "#333",
  },
  contactPhone: {
    fontSize: 13,
    opacity: 0.5,
    fontWeight: "500",
  },
  selectedCount: {
    textAlign: "center",
    fontSize: 14,
    opacity: 0.6,
    marginTop: 10,
  },
  warningMessage: {
    textAlign: "center",
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
    marginBottom: 10,
    marginTop: -5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#999",
    fontWeight: "500",
  },

  // Step 3: 개인정보
  privacyButton: {
    backgroundColor: "#F5F5F5",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  privacyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  privacyTextContainer: {
    maxHeight: 200,
    marginBottom: 20,
    borderRadius: 12,
  },
  privacyBox: {
    backgroundColor: "#F5F5F5",
    padding: 20,
    borderRadius: 12,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  agreeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  agreeText: {
    fontSize: 16,
    marginLeft: 8,
  },

  // 하단
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: "#6200ee",
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  button: {
    paddingVertical: 5,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
});
