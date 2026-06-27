// constants/content.ts

export const content = {
  en: {
    title: "FarmRisk",
    description:
      "An advanced agricultural intelligence platform integrating high-resolution remote sensing, satellite field mapping, and real-time climate data. Empowering farmers with localized risk mitigation analytics and predictive AI insights to optimize crop yield and operational sustainability.",
    heroEyebrow: "Satellite intelligence",
    heroHeading: "See the field before the risk arrives.",
    heroSubheading:
      "Track crop conditions, weather pressure, and field changes from one live view built for faster decisions.",
    heroCta: "Open Dashboard",
    version: "1.0.0",

    nav: {
      problem: "Problem",
      solution: "Solution",
      features: "Features",
      howItWorks: "How It Works",
      learnMore: "Learn More",
      advisoryEngine: "Advisory Engine",
      riskMonitor: "Risk Monitor",
      signIn: "Sign In",
      goDashboard: "Go to Dashboard",
      signOut: "Sign Out",
    },

    sidebar: {
      overview: "Overview",
      farmMap: "Farm Map",
      weatherStats: "Weather Stats",
      profile: "Profile",
      settings: "Settings",
      logout: "Log Out",
    },

    landing: {
      needCustom: "Need custom crop advisory models?",
      customDesc:
        "We provide agri-tech integrations and custom API portals for NGOs and FPOs.",
      contactTeam: "Contact Integration Team",
      freeTierNote:
        "Free tier supports village search. Farmland satellite mapping requires SaaS credentials.",

      processEyebrow: "Pipeline Architecture",
      processTitle: "From raw satellites to the field in three steps.",
      processDesc:
        "Our backend aggregates petabytes of environmental information, running automated QA checks and LLM engines to create targeted agricultural guidance.",
      step1Title: "Multi-Source Ingestion",
      step1Desc:
        "We ingest weather predictions from IMD, satellite vegetation records from NASA & ESA, and geography datasets from ISRO.",
      step2Title: "AI Advisory Generation",
      step2Desc:
        "Our RAG-LLM mapping engine checks weather trends against crop stages, farming guidelines, and current humidity to formulate targeted recommendations.",
      step3Title: "Multilingual Distribution",
      step3Desc:
        "Advisories are translated through our localization pipeline into English, Hindi, Marathi, and Tamil. Dispatched via web, app, and future SMS/WhatsApp integrations.",

      ctaEyebrow: "Platform Access",
      ctaHeading: "Start monitoring your farmland risk today.",
      ctaSubheading:
        "Verify if advisory forecasts are active for your village. Type your town or village below to run a micro-location compatibility check.",
      ctaPlaceholder: "Enter village name (e.g. Kalyan, Karur, Kota)...",
      coverageTitle: "Active advisory coverage confirmed.",
      coverageDesc:
        "High-resolution forecasts and lightning monitoring are active for {village} ({state}). Advisories are available in {language}.",
      searchAnother: "Search another village",
      ctaExplore: "Explore {village} Dashboard",
      ctaLaunch: "Launch Free Dashboard",
      ctaTechSpecs: "Technical Specifications",

      footerDesc:
        "Agro-meteorological decision support platform. Translating complex weather intelligence and remote sensing data into actionable recommendations for farmers and agri-tech companies.",
      footerRights: "© 2026 FarmRisk Platform. All rights reserved.",
    },

    dashboard: {
      title: "Good morning, Rakesh.",
      subtitle: "Village-level weather and field risk signals for today.",
      snapshot: "local snapshot",
      livePreview: "Live dashboard preview",
      weatherToday: "Weather Today",
      hourlyWeather: "Hourly Weather",
      forecast16Day: "16 Day Forecast",
      farmTasks: "Farm Tasks",
      aiOverview: "AI Overview",
      riskAssessment: "Risk assessment",
      intelligence: "Intelligence",
      comingNext: "Coming next",
      planningWindow: "Planning window",
      rainChance: "rain chance",
      today: "Today",
      taskIrrigation: "Irrigation schedule",
      taskFieldHealth: "Field health table",
      taskSensor: "Sensor alerts",
      statusPending: "Pending",
      statusCompleted: "Completed",
      statusActionNeeded: "Action Needed",

      clear: "Clear",
      sunny: "Sunny",
      partlycloudy: "Partly Cloudy",
      dryheat: "Dry Heat",
      cloudsbuilding: "Clouds Building",
      lightbreeze: "Light Breeze",
      hot: "Hot",
      cloudy: "Cloudy",
      showers: "Showers",
      humid: "Humid",
      rain: "Rain",
      warm: "Warm",

      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
      sun: "Sun",
      mon: "Mon",
      tue: "Tue",
    },

    profile: {
      title: "Profile details",
      eyebrow: "Your account",
      desc: "Keep the basic details FarmRisk uses to personalize your dashboard.",
      phoneLabel: "Phone number",
      phoneDesc: "Your phone number is managed by FarmRisk authentication.",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      ageLabel: "Age",
      agePlaceholder: "Age",
      locationLabel: "Location",
      locationPlaceholder: "Village, district, or city",
      saveBtn: "Save profile",
      savingBtn: "Saving...",
    },
    problem: {
      badge: "The Challenge",
      headingPart1: "Farmers face ",
      headingHighlight: "climate uncertainty",
      headingPart2: " every day",
      description:
        "Without reliable, localized weather information and actionable insights, farmers struggle to make critical decisions that directly impact their livelihood.",
      metrics: [
        {
          label: "Weather Uncertainty",
          value: "40%",
          impact: "crop loss risk",
          description:
            "Unpredictable rainfall and extreme weather events threaten agricultural productivity",
          link: "https://www.fao.org/climate-change/en/",
        },
        {
          label: "Information Gap",
          value: "78%",
          impact: "farmers lack access",
          description:
            "Critical weather data not available in regional languages or localized formats",
          link: "https://www.isro.gov.in/",
        },
        {
          label: "Poor Timing",
          value: "₹2.5L",
          impact: "avg. annual loss",
          description:
            "Incorrect timing of irrigation, sowing, and harvesting due to lack of actionable insights",
          link: "https://www.imd.gov.in/",
        },
      ],
      impactEyebrow: "The Cost of Uncertainty",
      impactTitle: "Billions in annual losses",
      impactDesc:
        "Without reliable information, farmers often incur significant losses due to poor timing of agricultural operations. Unpredictable weather patterns, lack of localized forecasts, and limited access to actionable advisories create a perfect storm of risk.",
      impactBtnSolution: "Discover the Solution",
      impactBtnLearnMore: "Learn More",
      goToSource: "Go to source",
    },
  },
  hi: {
    title: "FarmRisk",
    description:
      "एक उन्नत कृषि खुफिया मंच जो उच्च-रिज़ॉल्यूशन रिमोट सेंसिंग, सैटेलाइट फील्ड मैपिंग और वास्तविक समय के जलवायु डेटा को एकीकृत करता है। फसल की उपज और परिचालन स्थिरता को अनुकूलित करने के लिए किसानों को स्थानीय जोखिम शमन विश्लेषण और भविष्य कहनेवाला एआई अंतर्दृष्टि के साथ सशक्त बनाना।",
    heroEyebrow: "सैटेलाइट इंटेलिजेंस",
    heroHeading: "जोखिम आने से पहले खेत की स्थिति देखें।",
    heroSubheading:
      "तेजी से निर्णय लेने के लिए एक ही लाइव व्यू से फसल की स्थिति, मौसम के दबाव और खेत के बदलावों को ट्रैक करें।",
    heroCta: "डैशबोर्ड खोलें",
    version: "1.0.0",

    nav: {
      problem: "समस्या",
      solution: "समाधान",
      features: "विशेषताएं",
      howItWorks: "यह कैसे काम करता है",
      learnMore: "अधिक जानें",
      advisoryEngine: "सलाहकार इंजन",
      riskMonitor: "जोखिम मॉनिटर",
      signIn: "लॉग इन करें",
      getStarted: "शुरू करें",
      goDashboard: "डैशबोर्ड पर जाएं",
      signOut: "साइन आउट",
    },

    sidebar: {
      overview: "अवलोकन",
      farmMap: "खेत का नक्शा",
      weatherStats: "मौसम के आंकड़े",
      profile: "प्रोफ़ाइल",
      settings: "सेटिंग्स",
      logout: "लॉग आउट",
    },

    landing: {
      needCustom: "कस्टम फसल सलाहकार मॉडल की आवश्यकता है?",
      customDesc:
        "हम गैर सरकारी संगठनों (NGOs) और किसान उत्पादक संगठनों (FPOs) के लिए कृषि-तकनीक एकीकरण और कस्टम API पोर्टल प्रदान करते हैं।",
      contactTeam: "एकीकरण टीम से संपर्क करें",
      freeTierNote:
        "मुफ्त टियर ग्राम खोज का समर्थन करता है। कृषि भूमि सैटेलाइट मैपिंग के लिए SaaS क्रेडेंशियल की आवश्यकता होती है।",

      processEyebrow: "पाइपलाइन आर्किटेक्चर",
      processTitle: "कच्चे उपग्रह डेटा से खेत तक तीन चरणों में।",
      processDesc:
        "हमारा बैकएंड पर्यावरण संबंधी सूचनाओं के पेटाबाइट्स को एकत्रित करता है, लक्षित कृषि मार्गदर्शन बनाने के लिए स्वचालित क्यूए (QA) जांच और एलएलएम (LLM) इंजन चलाता है।",
      step1Title: "बहु-स्रोत अंतर्ग्रहण",
      step1Desc:
        "हम आईएमडी (IMD) से मौसम की भविष्यवाणियां, नासा (NASA) और ईएसए (ESA) से सैटेलाइट वनस्पति रिकॉर्ड और इसरो (ISRO) से भूगोल डेटासेट एकत्र करते हैं।",
      step2Title: "एआई सलाहकार उत्पादन",
      step2Desc:
        "हमारा आरएगे-एलएलएम (RAG-LLM) मैपिंग इंजन लक्षित सिफारिशें तैयार करने के लिए फसल के चरणों, कृषि दिशानिर्देशों और वर्तमान आर्द्रता के विरुद्ध मौसम के रुझान की जांच करता है।",
      step3Title: "बहुभाषी वितरण",
      step3Desc:
        "सलाहकारों को हमारी स्थानीयकरण पाइपलाइन के माध्यम से अंग्रेजी, हिंदी, मराठी और तमिल में अनुवादित किया जाता है। वेब, ऐप और भविष्य के एसएमएस/व्हाट्सएप एकीकरण के माध्यम से भेजा जाता है।",

      ctaEyebrow: "प्लेटफ़ॉर्म एक्सेस",
      ctaHeading: "आज ही अपनी कृषि भूमि के जोखिम की निगरानी शुरू करें।",
      ctaSubheading:
        "सत्यापित करें कि आपके गांव के लिए सलाहकार पूर्वानुमान सक्रिय हैं या नहीं। माइक्रो-लोकेशन अनुकूलता जांच चलाने के लिए नीचे अपना शहर या गांव टाइप करें।",
      ctaPlaceholder: "गांव का नाम दर्ज करें (जैसे कल्याण, करूर, कोटा)...",
      coverageTitle: "सक्रिय सलाहकार कवरेज की पुष्टि हुई।",
      coverageDesc:
        "{village} ({state}) के लिए उच्च-रिज़ॉल्यूशन पूर्वानुमान और बिजली की निगरानी सक्रिय हैं। सलाहकार {language} में उपलब्ध हैं।",
      searchAnother: "दूसरे गांव की खोज करें",
      ctaExplore: "{village} डैशबोर्ड देखें",
      ctaLaunch: "मुफ्त डैशबोर्ड शुरू करें",
      ctaTechSpecs: "तकनीकी विशिष्टताएं",

      footerDesc:
        "कृषि-मौसम विज्ञान निर्णय सहायता मंच। किसानों और कृषि-तकनीक कंपनियों के लिए कार्रवाई योग्य सिफारिशों में जटिल मौसम खुफिया और रिमोट सेंसिंग डेटा का अनुवाद करना।",
      footerRights:
        "© 2026 फार्मरिस्क (FarmRisk) प्लेटफॉर्म। सर्वाधिकार सुरक्षित।",
    },

    dashboard: {
      title: "शुभ प्रभात, राकेश।",
      subtitle: "आज के लिए ग्राम-स्तरीय मौसम और क्षेत्र जोखिम संकेत।",
      snapshot: "स्थानीय स्नैपशॉट",
      livePreview: "लाइव डैशबोर्ड पूर्वावलोकन",
      weatherToday: "आज का मौसम",
      hourlyWeather: "प्रति घंटा मौसम",
      forecast16Day: "16 दिवसीय पूर्वानुमान",
      farmTasks: "कृषि कार्य",
      aiOverview: "एआई अवलोकन",
      riskAssessment: "जोखिम मूल्यांकन",
      intelligence: "इंटेलिजेंस",
      comingNext: "आगे आ रहा है",
      planningWindow: "नियोजन विंडो",
      rainChance: "बारिश की संभावना",
      today: "आज",
      taskIrrigation: "सिंचाई अनुसूची",
      taskFieldHealth: "खेत स्वास्थ्य तालिका",
      taskSensor: "सेंसर अलर्ट",
      statusPending: "लंबित",
      statusCompleted: "पूर्ण",
      statusActionNeeded: "कार्रवाई आवश्यक",

      clear: "साफ",
      sunny: "धूप",
      partlycloudy: "आंशिक बादल",
      dryheat: "शुष्क गर्मी",
      cloudsbuilding: "बादल छा रहे हैं",
      lightbreeze: "हल्की हवा",
      hot: "गर्म",
      cloudy: "बादल",
      showers: "बौछारें",
      humid: "उमस",
      rain: "बारिश",
      warm: "गर्म",

      wed: "बुध",
      thu: "गुरु",
      fri: "शुक्र",
      sat: "शनि",
      sun: "रवि",
      mon: "सोम",
      tue: "मंगल",
    },

    profile: {
      title: "प्रोफ़ाइल विवरण",
      eyebrow: "आपका खाता",
      desc: "उन बुनियादी विवरणों को रखें जिनका उपयोग फार्मरिस्क आपके डैशबोर्ड को वैयक्तिकृत करने के लिए करता है।",
      phoneLabel: "फ़ोन नंबर",
      phoneDesc:
        "आपका फ़ोन नंबर फार्मरिस्क प्रमाणीकरण द्वारा प्रबंधित किया जाता है।",
      nameLabel: "नाम",
      namePlaceholder: "आपका नाम",
      ageLabel: "उम्र",
      agePlaceholder: "उम्र",
      locationLabel: "स्थान",
      locationPlaceholder: "गांव, जिला या शहर",
      saveBtn: "प्रोफ़ाइल सहेजें",
      savingBtn: "सहेज रहा है...",
    },
    problem: {
      badge: "चुनौती",
      headingPart1: "किसानों को हर दिन ",
      headingHighlight: "जलवायु अनिश्चितता",
      headingPart2: " का सामना करना पड़ता है",
      description:
        "विश्वसनीय, स्थानीयकृत मौसम की जानकारी और व्यावहारिक अंतर्दृष्टि के बिना, किसान महत्वपूर्ण निर्णय लेने के लिए संघर्ष करते हैं जो सीधे उनकी आजीविका को प्रभावित करते हैं।",
      metrics: [
        {
          label: "मौसम की अनिश्चितता",
          value: "40%",
          impact: "फसल नुकसान का जोखिम",
          description:
            "अप्रत्याशित वर्षा और अत्यधिक मौसम की घटनाएं कृषि उत्पादकता के लिए खतरा पैदा करती हैं",
          link: "https://www.fao.org/climate-change/en/",
        },
        {
          label: "सूचना का अंतर",
          value: "78%",
          impact: "किसानों के पास पहुंच नहीं है",
          description:
            "महत्वपूर्ण मौसम डेटा क्षेत्रीय भाषाओं या स्थानीय प्रारूपों में उपलब्ध नहीं है",
          link: "https://www.isro.gov.in/",
        },
        {
          label: "खराब समय",
          value: "₹2.5L",
          impact: "औसत वार्षिक हानि",
          description:
            "व्यावहारिक अंतर्दृष्टि की कमी के कारण सिंचाई, बुवाई और कटाई का गलत समय",
          link: "https://www.imd.gov.in/",
        },
      ],
      impactEyebrow: "अनिश्चितता की लागत",
      impactTitle: "सालाना अरबों का नुकसान",
      impactDesc:
        "विश्वसनीय जानकारी के बिना, किसानों को अक्सर कृषि कार्यों के खराब समय के कारण महत्वपूर्ण नुकसान उठाना पड़ता है। अप्रत्याशित मौसम के पैटर्न, स्थानीयकृत पूर्वानुमानों की कमी और व्यावहारिक सलाह तक सीमित पहुंच जोखिम का एक आदर्श तूफान पैदा करती है।",
      impactBtnSolution: "समाधान खोजें",
      impactBtnLearnMore: "अधिक जानें",
      goToSource: "स्रोत पर जाएं",
    },
  },
  mr: {
    title: "FarmRisk",
    description:
      "एक प्रगत कृषी बुद्धिमत्ता प्लॅटफॉर्म जो उच्च-रिझोल्यूशन रिमोट सेन्सिंग, सॅटेलाइट फील्ड मॅपिंग आणि वास्तविक वेळेतील हवामान डेटा एकत्रित करतो. पिकांचे उत्पादन आणि ऑपरेशनल शाश्वतता सुधारण्यासाठी शेतकऱ्यांना स्थानिक जोखीम कमी करणारे विश्लेषण आणि भविष्यसूचक AI अंतर्दृष्टीने सक्षम बनवणे.",
    heroEyebrow: "सॅटेलाईट इंटेलिजन्स",
    heroHeading: "धोका येण्यापूर्वी शेताची स्थिती पहा.",
    heroSubheading:
      "जलद निर्णयांसाठी पीक परिस्थिती, हवामानाचा दाब आणि शेतातील बदल एकाच लाईव्ह स्क्रीनवरून ट्रॅक करा.",
    heroCta: "डॅशबोर्ड उघडा",
    version: "1.0.0",

    nav: {
      problem: "समस्या",
      solution: "उपाय",
      features: "वैशिष्ट्ये",
      howItWorks: "हे कसे कार्य करते",
      learnMore: "अधिक जाणून घ्या",
      advisoryEngine: "सल्लागार इंजिन",
      riskMonitor: "धोका मॉनिटर",
      signIn: "लॉग इन करा",
      getStarted: "सुरू करा",
      goDashboard: "डॅशबोर्डवर जा",
      signOut: "साइन आउट",
    },

    sidebar: {
      overview: "आढावा",
      farmMap: "शेताचा नकाशा",
      weatherStats: "हवामान आकडेवारी",
      profile: "प्रोफाइल",
      settings: "सेटिंग्ज",
      logout: "लॉग आउट",
    },

    landing: {
      needCustom: "कस्टम पीक सल्लागार मॉडेल हवे आहे का?",
      customDesc:
        "आम्ही स्वयंसेवी संस्था (NGOs) आणि शेतकरी उत्पादक कंपन्यांसाठी (FPOs) ॲग्री-टेक इंटिग्रेशन आणि कस्टम API पोर्टल प्रदान करतो.",
      contactTeam: "इंटिग्रेशन टीमशी संपर्क साधा",
      freeTierNote:
        "मोफत टियर गाव शोधाला सपोर्ट करतो. शेतजमीन सॅटेलाईट मॅपिंगसाठी SaaS क्रेडेंशियल्स आवश्यक आहेत.",

      processEyebrow: "पाइपलाईन आर्किटेक्चर",
      processTitle: "सॅटेलाईट डेटापासून थेट शेतापर्यंत तीन सोप्या टप्प्यात.",
      processDesc:
        "आमचे बॅकएंड हवामान अंदाजांचे संकलन करते आणि शेतीसाठी योग्य मार्गदर्शन तयार करण्यासाठी स्वयंचलित QA तपासणी आणि LLM इंजिन चालवते.",
      step1Title: "अनेक स्रोतांचे संकलन",
      step1Desc:
        "आम्ही IMD कडून हवामान अंदाज, NASA आणि ESA कडून सॅटेलाईट वनस्पती नोंदी आणि ISRO कडून भौगोलिक डेटा गोळा करतो.",
      step2Title: "AI सल्लागार निर्मिती",
      step2Desc:
        "आमचे RAG-LLM मॅपिंग इंजिन पिकांचे टप्पे, शेती मार्गदर्शक तत्त्वे आणि हवेतील आर्द्रता तपासून हवामान अंदाजानुसार योग्य शिफारसी तयार करते.",
      step3Title: "बहुभाषिक वितरण",
      step3Desc:
        "सल्ल्यांचे भाषांतर आमच्या स्थानिक पाइपलाईनद्वारे इंग्रजी, हिंदी, मराठी आणि तमिळमध्ये केले जाते. हे वेब, ॲप आणि भविष्यात SMS/WhatsApp द्वारे पाठवले जाईल.",

      ctaEyebrow: "प्लॅटफॉर्म प्रवेश",
      ctaHeading: "आजच तुमच्या शेतातील जोखमीचे निरीक्षण सुरू करा.",
      ctaSubheading:
        "तुमच्या गावासाठी सल्लागार अंदाज सक्रिय आहेत का ते तपासा. मायक्रो-लोकेशन सुसंगतता तपासण्यासाठी खाली तुमच्या शहराचे किंवा गावाचे नाव टाईप करा.",
      ctaPlaceholder: "गावाचे नाव टाका (उदा. कल्याण, कर्जत, कोटा)...",
      coverageTitle: "सक्रिय सल्लागार कव्हरेजची पुष्टी झाली.",
      coverageDesc:
        "{village} ({state}) साठी हाय-रिझोल्यूशन अंदाज आणि विजांचे निरीक्षण सक्रिय आहे. शिफारसी {language} मध्ये उपलब्ध आहेत.",
      searchAnother: "दुसरे गाव शोधा",
      ctaExplore: "{village} डॅशबोर्ड पहा",
      ctaLaunch: "मोफत डॅशबोर्ड सुरू करा",
      ctaTechSpecs: "तांत्रिक वैशिष्ट्ये",

      footerDesc:
        "कृषी-हवामान निर्णय समर्थन प्लॅटफॉर्म. हवामान माहिती आणि सॅटेलाईट डेटाचे शेतकऱ्यांसाठी उपयुक्त शिफारसींमध्ये रूपांतर करणे.",
      footerRights: "© 2026 फार्मरिस्क (FarmRisk) प्लॅटफॉर्म. सर्व हक्क राखीव.",
    },

    dashboard: {
      title: "शुभ प्रभात, राकेश.",
      subtitle: "आजचे गाव-स्तरीय हवामान आणि शेतातील धोके.",
      snapshot: "स्थानिक स्नॅपशॉट",
      livePreview: "लाइव्ह डॅशबोर्ड पूर्वावलोकन",
      weatherToday: "आजचे हवामान",
      hourlyWeather: "प्रति तास हवामान",
      forecast16Day: "१६ दिवसांचा अंदाज",
      farmTasks: "शेतातील कामे",
      aiOverview: "AI आढावा",
      riskAssessment: "धोका मूल्यांकन",
      intelligence: "इंटेलिजेंस",
      comingNext: "पुढे येणारे",
      planningWindow: "नियोजन विंडो",
      rainChance: "पावसाची शक्यता",
      today: "आज",
      taskIrrigation: "सिंचन वेळापत्रक",
      taskFieldHealth: "शेताचे आरोग्य पत्रक",
      taskSensor: "सेंसर सूचना",
      statusPending: "प्रलंबित",
      statusCompleted: "पूर्ण",
      statusActionNeeded: "कृती आवश्यक",

      clear: "स्वच्छ",
      sunny: "ऊन",
      partlycloudy: "अंशतः ढगाळ",
      dryheat: "कोरडी उष्णता",
      cloudsbuilding: "ढग साचत आहेत",
      lightbreeze: "मंद वारा",
      hot: "उष्ण",
      cloudy: "ढगाळ",
      showers: "अतिवृष्टी",
      humid: "दमट",
      rain: "पाऊस",
      warm: "उबदार",

      wed: "बुध",
      thu: "गुरु",
      fri: "शुक्र",
      sat: "शनी",
      sun: "रवी",
      mon: "सोम",
      tue: "मंंगळ",
    },

    profile: {
      title: "प्रोफाइल तपशील",
      eyebrow: "तुमचे खाते",
      desc: "तुमचा डॅशबोर्ड वैयक्तिकृत करण्यासाठी फार्मरिस्क वापरत असलेली मूलभूत माहिती येथे ठेवा.",
      phoneLabel: "फोन नंबर",
      phoneDesc:
        "तुमचा फोन नंबर फार्मरिस्क ऑथेंटिकेशनद्वारे व्यवस्थापित केला जातो.",
      nameLabel: "नाव",
      namePlaceholder: "तुमचे नाव",
      ageLabel: "वय",
      agePlaceholder: "वय",
      locationLabel: "स्थान",
      locationPlaceholder: "गाव, जिल्हा किंवा शहर",
      saveBtn: "प्रोफाइल जतन करा",
      savingBtn: "जतन करत आहे...",
    },
    problem: {
      badge: "आव्हान",
      headingPart1: "शेतकऱ्यांना दररोज ",
      headingHighlight: "हवामान अनिश्चिततेचा",
      headingPart2: " सामना करावा लागतो",
      description:
        "विश्वासार्ह, स्थानिक हवामान माहिती आणि कृती करण्यायोग्य अंतर्दृष्टीशिवाय, शेतकरी त्यांच्या उपजीविकेवर थेट परिणाम करणारे महत्त्वाचे निर्णय घेण्यासाठी धडपडतात.",
      metrics: [
        {
          label: "हवामान अनिश्चितता",
          value: "40%",
          impact: "पीक नुकसानीचा धोका",
          description:
            "अकल्पित पाऊस आणि कमालीचे हवामान शेती उत्पादकतेला धोका निर्माण करतात",
          link: "https://www.fao.org/climate-change/en/",
        },
        {
          label: "माहितीचा अभाव",
          value: "78%",
          impact: "शेतकऱ्यांकडे प्रवेश नाही",
          description:
            "महत्त्वपूर्ण हवामान डेटा प्रादेशिक भाषांमध्ये किंवा स्थानिक स्वरूपात उपलब्ध नाही",
          link: "https://www.isro.gov.in/",
        },
        {
          label: "नियोजनाचा अभाव",
          value: "₹2.5L",
          impact: "सरासरी वार्षिक नुकसान",
          description:
            "कृती करण्यायोग्य अंतर्दृष्टीच्या अभावामुळे सिंचन, पेरणी आणि कापणीची चुकीची वेळ",
          link: "https://www.imd.gov.in/",
        },
      ],
      impactEyebrow: "अनिश्चिततेचा खर्च",
      impactTitle: "वार्षिक अब्जावधींचे नुकसान",
      impactDesc:
        "विश्वासार्ह माहितीशिवाय, शेती कामांच्या चुकीच्या नियोजनामुळे शेतकऱ्यांना अनेकदा मोठे नुकसान सहन करावे लागते. लहरी हवामान, स्थानिक अंदाजांचा अभाव आणि सल्लागारांचा मर्यादित प्रवेश यामुळे धोक्याची परिस्थिती निर्माण होते.",
      impactBtnSolution: "उपाय शोधा",
      impactBtnLearnMore: "अधिक जाणून घ्या",
      goToSource: "स्रोताकडे जा",
    },
  },
  ta: {
    title: "FarmRisk",
    description:
      "உயர் தெளிவுத்திறன் கொண்ட ரிமோட் சென்சிங், செயற்கைக்கோள் வயல் வரைபடம் மற்றும் நிகழ்நேர காலநிலை தரவுகளை ஒருங்கிணைக்கும் ஒரு மேம்பட்ட விவசாய நுண்ணறிவு தளம். விவசாயிகளுக்கு உள்ளூர்மயமாக்கப்பட்ட ஆபத்து குறைப்பு பகுப்பாய்வு மற்றும் முன்கணிப்பு AI நுண்ணறிவுகளுடன் அதிகாரம் அளிக்கிறது.",
    heroEyebrow: "செயற்கைக்கோள் நுண்ணறிவு",
    heading: "ஆபத்து வருவதற்குள் வயலைப் பாருங்கள்.",
    heroHeading: "ஆபத்து வருவதற்குள் வயலைப் பாருங்கள்.",
    heroSubheading:
      "வேகமான முடிவுகளுக்கு பயிர் நிலைமைகள், வானிலை அழுத்தம் மற்றும் வயல் மாற்றங்களை ஒரே நேரடி பார்வையில் கண்காணிக்கவும்.",
    heroCta: "டாஷ்போர்டைத் திறக்கவும்",
    version: "1.0.0",

    nav: {
      problem: "பிரச்சனை",
      solution: "தீர்வு",
      features: "அம்சங்கள்",
      howItWorks: "செயல்முறை",
      learnMore: "மேலும் அறிய",
      advisoryEngine: "ஆலோசனை இயந்திரம்",
      riskMonitor: "ஆபத்து கண்காணிப்பு",
      signIn: "உள்நுழைக",
      getStarted: "தொடங்குக",
      goDashboard: "டாஷ்போர்டுக்குச் செல்க",
      signOut: "வெளியேறுக",
    },

    sidebar: {
      overview: "கண்ணோட்டம்",
      farmMap: "விவசாய வரைபடம்",
      weatherStats: "வானிலை புள்ளிவிவரங்கள்",
      profile: "சுயவிவரம்",
      settings: "அமைப்புகள்",
      logout: "வெளியேறு",
    },

    landing: {
      needCustom: "தனிப்பயன் பயிர் ஆலோசனை மாதிரிகள் தேவையா?",
      customDesc:
        "NGOக்கள் மற்றும் FPOகளுக்கு விவசாய தொழில்நுட்ப ஒருங்கிணைப்புகள் மற்றும் தனிப்பயன் API போர்ட்டல்களை வழங்குகிறோம்.",
      contactTeam: "ஒருங்கிணைப்புக் குழுவைத் தொடர்பு கொள்ளவும்",
      freeTierNote:
        "இலவச அடுக்கு கிராமத் தேடலை ஆதரிக்கிறது. விவசாய நில செயற்கைக்கோள் வரைபடத்திற்கு SaaS சான்றுகள் தேவை.",

      processEyebrow: "பைப்லைன் கட்டமைப்பு",
      processTitle:
        "செயற்கைக்கோள் தரவிலிருந்து நேரடியாக வயலுக்கு மூன்று படிகளில்.",
      processDesc:
        "எங்கள் பின்னணி வானிலை முன்னறிவிப்புகளைச் சேகரித்து, இலக்கு விவசாய வழிகாட்டுதலை உருவாக்க தானியங்கி QA சோதனைகள் மற்றும் LLM இயந்திரங்களை இயக்குகிறது.",
      step1Title: "பல்வேறு ஆதாரங்களின் உள்ளீடு",
      step1Desc:
        "IMD வானிலை முன்னறிவிப்புகள், NASA மற்றும் ESA ஆகியவற்றிலிருந்து செயற்கைக்கோள் தாவரப் பதிவுகள் மற்றும் ISRO விலிருந்து புவியியல் தரவுகளைப் பெறுகிறோம்.",
      step2Title: "AI ஆலோசனை உருவாக்கம்",
      step2Desc:
        "எங்கள் RAG-LLM வரைபட இயந்திரம் பயிர் நிலைகள், விவசாய வழிகாட்டுதல்கள் आणि தற்போதைய ஈரப்பதத்திற்கு எதிராக வானிலை போக்குகளை சரிபார்த்து ஆலோசனைகளை உருவாக்குகிறது.",
      step3Title: "பல்மொழி விநியோகம்",
      step3Desc:
        "ஆலோசனைகள் ஆங்கிலம், இந்தி, மராத்தி மற்றும் தமிழ் மொழிகளில் மொழிபெயர்க்கப்பட்டு இணையம், செயலி மற்றும் எதிர்கால SMS/WhatsApp வழியாக அனுப்பப்படுகின்றன.",

      ctaEyebrow: "தள அணுகல்",
      ctaHeading:
        "இன்றே உங்கள் விவசாய நில அபாயத்தைக் கண்காணிக்கத் தொடங்குங்கள்.",
      ctaSubheading:
        "உங்கள் கிராமத்திற்கான ஆலோசனை முன்னறிவிப்புகள் செயலில் உள்ளதா என்பதைச் சரிபார்க்கவும். நகர அல்லது கிராமத்தின் பெயரை உள்ளிட்டு சரிபார்க்கவும்.",
      ctaPlaceholder:
        "கிராமத்தின் பெயரை உள்ளிடவும் (उदा. Kalyan, Karur, Kota)...",
      coverageTitle: "செயலில் உள்ள ஆலோசனை கவரேஜ் உறுதி செய்யப்பட்டது.",
      coverageDesc:
        "{village} ({state}) க்கான உயர் தெளிவுத்திறன் முன்னறிவிப்புகள் மற்றும் மின்னல் கண்காணிப்பு செயலில் உள்ளன. ஆலோசனைகள் {language} இல் கிடைக்கின்றன.",
      searchAnother: "மற்றொரு கிராமத்தைத் தேடுங்கள்",
      ctaExplore: "{village} டாஷ்போர்டை ஆராயுங்கள்",
      ctaLaunch: "இலவச டாஷ்போர்டைத் தொடங்கவும்",
      ctaTechSpecs: "தொழில்நுட்ப விவரக்குறிப்புகள்",

      footerDesc:
        "வேளாண்-வானிலை முடிவு ஆதரவு தளம். வானிலை நுண்ணறிவு மற்றும் செயற்கைக்கோள் தரவை விவசாயிகளுக்கு பயனுள்ள ஆலோசனைகளாக மாற்றுதல்.",
      footerRights:
        "© 2026 பார்ம்ரிஸ்க் (FarmRisk) தளம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    },

    dashboard: {
      title: "காலை வணக்கம், ராகேஷ்.",
      subtitle: "இன்றைய கிராம அளவிலான வானிலை மற்றும் வயல்வெளி அபாயங்கள்.",
      snapshot: "உள்ளூர் நிலவரம்",
      livePreview: "நேரடி டாஷ்போர்டு முன்னோட்டம்",
      weatherToday: "இன்றைய வானிலை",
      hourlyWeather: "மணிநேர வானிலை",
      forecast16Day: "16 நாள் முன்னறிவிப்பு",
      farmTasks: "விவசாய பணிகள்",
      aiOverview: "AI கண்ணோட்டம்",
      riskAssessment: "அபாய மதிப்பீடு",
      intelligence: "நுண்ணறிவு",
      comingNext: "அடுத்து வருபவை",
      planningWindow: "திட்டமிடல் காலம்",
      rainChance: "மழைக்கான வாய்ப்பு",
      today: "இன்று",
      taskIrrigation: "நீர்ப்பாசன அட்டவணை",
      taskFieldHealth: "வயல் சுகாதார அட்டவணை",
      taskSensor: "சென்சார் எச்சரிக்கைகள்",
      statusPending: "நிலுவையில் உள்ளது",
      statusCompleted: "நிறைவடைந்தது",
      statusActionNeeded: "நடவடிக்கை தேவை",

      clear: "தெளிவானது",
      sunny: "வெயில்",
      partlycloudy: "பகுதி மேகமூட்டம்",
      dryheat: "வறண்ட வெப்பம்",
      cloudsbuilding: "மேகங்கள் குவிகின்றன",
      lightbreeze: "லேசான காற்று",
      hot: "வெப்பம்",
      cloudy: "மேகமூட்டம்",
      showers: "மழைத்தூறல்",
      humid: "ஈரப்பதம்",
      rain: "மழை",
      warm: "இதமான வெப்பம்",

      wed: "புதன்",
      thu: "வியாழன்",
      fri: "வெள்ளி",
      sat: "சனி",
      sun: "ஞாயிறு",
      mon: "திங்கள்",
      tue: "செவ்வாய்",
    },

    profile: {
      title: "சுயவிவர விவரங்கள்",
      eyebrow: "உங்கள் கணக்கு",
      desc: "உங்கள் டாஷ்போர்டைத் தனிப்பயனாக்க பார்ம்ரிસ્ક பயன்படுத்தும் அடிப்படை விவரங்களை இங்கே வைத்திருங்கள்.",
      phoneLabel: "தொலைபேசி எண்",
      phoneDesc:
        "உங்கள் தொலைபேசி எண் பார்ம்ரிஸ்க் அங்கீகாரத்தால் நிர்வகிக்கப்படுகிறது.",
      nameLabel: "பெயர்",
      namePlaceholder: "உங்கள் பெயர்",
      ageLabel: "வயது",
      agePlaceholder: "வயது",
      locationLabel: "இருப்பிடம்",
      locationPlaceholder: "கிராமம், மாவட்டம் அல்லது நகரம்",
      saveBtn: "சுயவிவரத்தைச் சேમીக்கவும்",
      savingBtn: "சேமிக்கப்படுகிறது...",
    },
    problem: {
      badge: "சவால்",
      headingPart1: "விவசாயிகள் ஒவ்வொரு நாளும் ",
      headingHighlight: "காலநிலை நிச்சயமற்ற தன்மையை",
      headingPart2: " எதிர்கொள்கின்றனர்",
      description:
        "நம்பகமான, உள்ளூர் வானிலை தகவல்கள் மற்றும் செயல்படக்கூடிய ஆலோசனைகள் இல்லாததால், விவசாயிகள் தங்கள் வாழ்வாதாரத்தை நேரடியாகப் பாதிக்கும் முக்கியமான முடிவுகளை எடுக்க சிரமப்படுகிறார்கள்.",
      metrics: [
        {
          label: "வானிலை நிச்சயமற்ற தன்மை",
          value: "40%",
          impact: "பயிர் இழப்பு ஆபத்து",
          description:
            "கணிக்க முடியாத மழைப்பொழிவு மற்றும் தீவிர வானிலை நிகழ்வுகள் விவசாய உற்பத்தியை அச்சுறுத்துகின்றன",
          link: "https://www.fao.org/climate-change/en/",
        },
        {
          label: "தகவல் இடைவெளி",
          value: "78%",
          impact: "விவசாயிகளுக்கு அணுகல் இல்லை",
          description:
            "முக்கியமான வானிலை தரவு பிராந்திய மொழிகளிலோ அல்லது உள்ளூர் வடிவங்களிலோ கிடைக்கவில்லை",
          link: "https://www.isro.gov.in/",
        },
        {
          label: "தவறான நேரம்",
          value: "₹2.5L",
          impact: "சராசரி ஆண்டு இழப்பு",
          description:
            "செயல்படக்கூடிய நுண்ணறிவு இல்லாததால் நீர்ப்பாசனம், விதைப்பு மற்றும் அறுவடையின் தவறான நேரம்",
          link: "https://www.imd.gov.in/",
        },
      ],
      impactEyebrow: "நிச்சயமற்ற தன்மையின் விலை",
      impactTitle: "ஆண்டுதோறும் கோடிக்கணக்கான இழப்பு",
      impactDesc:
        "நம்பகமான தகவல் இல்லாததால், விவசாய நடவடிக்கைகளின் தவறான நேரத்தின் காரணமாக விவசாயிகள் பெரும்பாலும் குறிப்பிடத்தக்க இழப்புகளைச் சந்திக்கின்றனர். கணிக்க முடியாத வானிலை, உள்ளூர் கணிப்புகள் இல்லாதது மற்றும் ஆலோசனைகளுக்கான குறைந்த அணுகல் ஆகியவை ஆபத்தை உருவாக்குகின்றன.",
      impactBtnSolution: "தீர்வை கண்டறியவும்",
      impactBtnLearnMore: "மேலும் அறிய",
      goToSource: "மூலத்திற்குச் செல்லவும்",
    },
  },
  gu: {
    title: "FarmRisk",
    description:
      "એક અદ્યતન કૃષિ ગુપ્તચર પ્લેટફોર્મ જે ઉચ્ચ-રિઝોલ્યુશન રિમોટ સેન્સિંગ, સેટેલાઇટ ફીલ્ડ મેપિંગ અને રીઅલ-ટાઇમ ક્લાઇમેટ ડેટાને એકીકૃત કરે છે. પાકની ઉપજ અને ઓપરેશનલ ટકાઉપણું સુધારવા માટે ખેડૂતોને સ્થાનિક જોખમ શમન વિશ્લેષણ आणि આગાહી એઆઈ આંતરદૃષ્ટિથી સક્ષમ બનાવવું.",
    heroEyebrow: "સેટેલાઇટ ઇન્ટેલિજન્સ",
    heroHeading: "જોખમ આવે તે પહેલાં ખેતરની સ્થિતિ જુઓ.",
    heroSubheading:
      "ઝડપી નિર્ણયો માટે પાકની સ્થિતિ, હવામાનનું દબાણ અને ખેતરના ફેરફારોને એક જ લાઈવ સ્ક્રીન પરથી ટ્રૅક કરો.",
    heroCta: "ડેશબોર્ડ ખોલો",
    version: "1.0.0",

    nav: {
      problem: "સમસ્યા",
      solution: "ઉકેલ",
      features: "વિશેષતાઓ",
      howItWorks: "તે કેવી રીતે કામ કરે છે",
      learnMore: "વધુ જાણો",
      advisoryEngine: "સલાહકાર એન્જિન",
      riskMonitor: "જોખમ મોનિટર",
      signIn: "લૉગ ઇન કરો",
      getStarted: "શરૂ કરો",
      goDashboard: "ડેશબોર્ડ પર જાઓ",
      signOut: "સાઇન આઉટ",
    },

    sidebar: {
      overview: "સારાંશ",
      farmMap: "ખેતરનો નકશો",
      weatherStats: "હવામાન આંકડા",
      profile: "પ્રોફાઇલ",
      settings: "સેટિંગ્સ",
      logout: "લૉગ આઉટ",
    },

    landing: {
      needCustom: "કસ્ટમ પાક સલાહકાર મોડેલ જોઈએ છે?",
      customDesc:
        "અમે બિન-સરકારી સંસ્થાઓ (NGOs) અને ખેડૂત ઉત્પાદક સંગઠનો (FPOs) માટે કૃષિ-તકનીક એકીકરણ અને કસ્ટમ API પોર્ટલ પ્રદાન કરીએ છીએ.",
      contactTeam: "એકીકરણ ટીમનો સંપર્ક કરો",
      freeTierNote:
        "મફત સ્તર ગ્રામ્ય શોધને સપોર્ટ કરે છે. ખેતીની જમીનના સેટેલાઇટ મેપિંગ માટે SaaS ઓળખપત્રોની જરૂર છે.",

      processEyebrow: "પાઇપલાઇન આર્કિટેક્ચર",
      processTitle: "સેટેલાઇટ ડેટાથી સીધા ખેતર સુધી ત્રણ સરળ પગલાંમાં.",
      processDesc:
        "અમારું બેકએન્ડ હવામાન આગાહીઓનું સંકલન કરે છે અને ખેતી માટે યોગ્ય માર્ગદર્શન તૈયાર કરવા માટે સ્વચાલित QA તપાસ અને LLM એન્જિન ચલાવે છે.",
      step1Title: "મલ્ટી-સોર્સ ઇન્જેશન",
      step1Desc:
        "અમે IMD તરફથી હવામાન આગાહીઓ, NASA અને ESA તરફથી સેટેલાઇટ વનસ્પતિ રેકોર્ડ્સ અને ISRO તરફથી ભૌગોલિક ડેટા એકત્રિત કરીએ છીએ.",
      step2Title: "AI સલાહકાર નિર્માણ",
      step2Desc:
        "અમારું RAG-LLM મેપિંગ એન્જિન પાકના તબક્કા, ખેતી માર્ગદર્શિકા અને હવામાં ભેજ ચકાસીને હવામાન આગાહી મુજબ યોગ્ય ભલામણો તૈયાર કરે છે.",
      step3Title: "બહુભાષી વિતરણ",
      step3Desc:
        "સલાહ અનુવાદ અમારી સ્થાનિક પાઇપલાઇન દ્વારા અંગ્રેજી, હિન્દી, મરાઠી અને તમિલમાં થાય છે. તે વેબ, એપ અને ભવિષ્યમાં SMS/WhatsApp દ્વારા મોકલવામાં આવશે.",

      ctaEyebrow: "પ્લેટફોર્મ ઍક્સેસ",
      ctaHeading: "આજથી જ તમારા ખેતરના જોખમનું નિરીક્ષણ શરૂ કરો.",
      ctaSubheading:
        "તમારા ગામ માટે સલાહકાર આગાહીઓ સક્રિય છે કે કેમ તે તપાસો. માઇક્રો-લોકેશન સુસંગતતા તપાસવા માટે નીચે તમારા શહેર અથવા ગામનું નામ ટાઇપ કરો.",
      ctaPlaceholder: "ગામનું નામ દાખલ કરો (દા.ત. Kalyan, Karur, Kota)...",
      coverageTitle: "સક્રિય સલાહકાર કવરેજની પુષ્ટિ થઈ.",
      coverageDesc:
        "{village} ({state}) માટે હાઇ-રિઝોલ્યુશન આગાહીઓ અને વીજળીનું નિરીક્ષણ સક્રિય છે. સલાહ {language} માં ઉપલબ્ધ છે.",
      searchAnother: "બીજા ગામની શોધ કરો",
      ctaExplore: "{village} ડેશબોર્ડ જુઓ",
      ctaLaunch: "મફત ડેશબોર્ડ શરૂ કરો",
      ctaTechSpecs: "તકનીકી વિશિષ્ટતાઓ",

      footerDesc:
        "કૃષિ-હવામાન નિર્ણય સમર્થન પ્લેટફોર્મ. હવામાન માહિતી અને સેટેલાઇટ ડેટાનું ખેડૂતો માટે ઉપયોગી ભલામણોમાં રૂપાંતર કરવું.",
      footerRights:
        "© 2026 ફાર્મરિસ્ક (FarmRisk) પ્લેટફોર્મ. સર્વાધિકાર સુરક્ષિત.",
    },

    dashboard: {
      title: "શુભ પ્રભાત, રાકેશ.",
      subtitle: "આજના ગ્રામ્ય સ્તરના હવામાન અને ખેતરના જોખમો.",
      snapshot: "સ્થાનિક સ્થિતિ",
      livePreview: "લાઈવ ડેશબોર્ડ પૂર્વાવલોકન",
      weatherToday: "આજનું હવામાન",
      hourlyWeather: "પ્રતિ કલાક હવામાન",
      forecast16Day: "16 દિવસની આગાહી",
      farmTasks: "ખેતીના કાર્યો",
      aiOverview: "AI સારાંશ",
      riskAssessment: "જોખમ મૂલ્યાંકન",
      intelligence: "ઇન્ટેલિજન્સ",
      comingNext: "આગળ આવી રહ્યું છે",
      planningWindow: "આયોજન વિન્ડો",
      rainChance: "વરસાદની સંભાવના",
      today: "આજે",
      taskIrrigation: "સિંચાઈ સમયપત્રક",
      taskFieldHealth: "ખેતર સ્વાસ્થ્ય કોષ્ટક",
      taskSensor: "સેન્સર ચેતવણીઓ",
      statusPending: "બાકી",
      statusCompleted: "પૂર્ણ",
      statusActionNeeded: "પગલાં જરૂરી",

      clear: "ચોખ્ખું",
      sunny: "તડકો",
      partlycloudy: "આંશિક વાદળછાયું",
      dryheat: "સૂકી ગરમી",
      cloudsbuilding: "વાદળો ઘેરાય છે",
      lightbreeze: "હળવો પવન",
      hot: "ગરમ",
      cloudy: "વાદળછાયું",
      showers: "ઝરમર વરસાદ",
      humid: "ભેજવાળું",
      rain: "વરસાદ",
      warm: "હૂંફાળું",

      wed: "બુધ",
      thu: "ગુરુ",
      fri: "શુક્ર",
      sat: "શનિ",
      sun: "રવિ",
      mon: "સોમ",
      tue: "મંગળ",
    },

    profile: {
      title: "પ્રોફાઇલ વિગતો",
      eyebrow: "તમારું ખાતું",
      desc: "તમારા ડેશબોર્ડને વ્યક્તિગત કરવા માટે ફાર્મરિસ્ક ઉપયોગ કરે છે તે મૂળભૂત વિગતો અહીં રાખો.",
      phoneLabel: "ફોન નંબર",
      phoneDesc: "તમારો ફોન નંબર ફાર્મરિસ્ક ઓથેન્ટિકેશન દ્વારા સંચાલित થાય છે.",
      nameLabel: "નામ",
      namePlaceholder: "તમારું નામ",
      ageLabel: "ઉંમર",
      agePlaceholder: "ઉંમર",
      locationLabel: "સ્થાન",
      locationPlaceholder: "ગામ, જિલ્લો અથવા શહેર",
      saveBtn: "પ્રોફાઇલ સાચવો",
      savingBtn: "સાચવી રહ્યું છે...",
    },
    problem: {
      badge: "પડકાર",
      headingPart1: "ખેડૂતો દરરોજ ",
      headingHighlight: "હવામાનની અનિશ્ચિતતાનો",
      headingPart2: " સામનો કરે છે",
      description:
        "વિશ્વસનીય, સ્થાનિક હવામાન માહિતી અને યોગ્ય માર્ગદર્શન વિના, ખેડૂતો તેમની આજીવિકાને સીધી અસર કરતા મહત્વપૂર્ણ નિર્ણયો લેવા માટે સંઘર્ષ કરે છે.",
      metrics: [
        {
          label: "હવામાન અનિશ્ચિતતા",
          value: "40%",
          impact: "પાક નુકસાનનું જોખમ",
          description:
            "અણધારી વરસાદ અને અતિશય હવામાનની ઘટનાઓ કૃષિ ઉત્પાદકતા માટે જોખમ ઊભું કરે છે",
          link: "https://www.fao.org/climate-change/en/",
        },
        {
          label: "માહિતીનો અભાવ",
          value: "78%",
          impact: "ખેડૂતો પાસે પહોંચ નથી",
          description:
            "મહત્વપૂર્ણ હવામાન માહિતી પ્રાદેશિક ભાષાઓમાં અથવા સ્થાનિક સ્વરૂપોમાં ઉપલબ્ધ નથી",
          link: "https://www.isro.gov.in/",
        },
        {
          label: "ખોટો સમય",
          value: "₹2.5L",
          impact: "સરેરાશ વાર્ષિક નુકસાન",
          description:
            "માહિતીના અભાવને કારણે સિંચાઈ, વાવણી અને લણણીનો ખોટો સમય",
          link: "https://www.imd.gov.in/",
        },
      ],
      impactEyebrow: "અનિશ્ચિતતાની કિંમત",
      impactTitle: "વાર્ષિક અબજોનું નુકસાન",
      impactDesc:
        "વિશ્વસનીય માહિતી વિના, ખેતીકામના ખોટા સમયને કારણે ખેડૂતોને વારંવાર મોટું નુકસાન સહન કરવું પડે છે. લહેરી હવામાન, સ્થાનિક અંદાજોનો અભાવ અને મર્યાદિત સલાહ સેવાઓ જોખમ વધારે છે.",
      impactBtnSolution: "ઉકેલ શોધો",
      impactBtnLearnMore: "વધુ જાણો",
      goToSource: "સ્ત્રોત પર જાઓ",
    },
  },
};

export type LanguageCode = keyof typeof content;
export type TranslationType = typeof content.en;

export const SIDEBAR_NAV_ITEMS = [
  {
    title: "Overview",
    link: "/dashboard",
    iconName: "layout",
  },
  {
    title: "Farm Map",
    link: "/dashboard/map",
    iconName: "map",
  },
  {
    title: "Weather Stats",
    link: "/dashboard/weather",
    iconName: "cloud",
  },
];

export const SIDEBAR_FOOTER_ITEMS = [
  {
    title: "Profile",
    link: "/dashboard/profile",
    iconName: "settings",
  },
  { title: "Settings", link: "/dashboard/settings", iconName: "settings" },
];
