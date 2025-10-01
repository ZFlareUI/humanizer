#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';


function analyzeAIPatterns(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const aiPatterns = [];

  if (words.length === 0 || sentences.length === 0) {
    return {
      aiPatterns: ['Insufficient text for analysis'],
      formalityScore: 0,
      repetitionScore: 0,
      passiveCount: 0,
      passiveScore: 0,
      sentenceVariety: 0,
      starterScore: 0,
      contractionScore: 0,
      transitionScore: 0,
      vocabDiversity: 0,
      overallAIScore: 0,
      detailedMetrics: {
        totalWords: words.length,
        totalSentences: sentences.length,
        avgSentenceLength: 0,
        uniqueWordRatio: 0,
        contractionCount: 0,
        passiveVoiceInstances: 0
      }
    };
  }

  // 1. Formality Analysis
  const formalWords = [
    'utilize', 'implement', 'facilitate', 'leverage', 'optimize', 'strategic',
    'comprehensive', 'methodology', 'framework', 'paradigm', 'subsequently',
    'aforementioned', 'nonetheless', 'heretofore', 'wherein', 'whereby',
    'notwithstanding', 'henceforth', 'ascertain', 'endeavor', 'procure',
    'paramount', 'integral', 'quintessential', 'multifaceted', 'substantiate'
  ];
  const formalCount = words.filter(word => formalWords.includes(word)).length;
  const formalityScore = Math.min((formalCount / words.length) * 5, 1);

  // 2. Repetition Analysis
  const wordFreq = new Map();
  const phraseFreq = new Map();
  
  words.forEach((word, i) => {
    if (word.length > 3) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
    if (i < words.length - 1) {
      const phrase = `${word} ${words[i + 1]}`;
      phraseFreq.set(phrase, (phraseFreq.get(phrase) || 0) + 1);
    }
  });

  const repetitionScore = Array.from(wordFreq.values()).reduce((sum, freq) => 
    sum + (freq > 2 ? (freq - 2) * 0.5 : 0), 0) / words.length;
  
  const phraseRepetition = Array.from(phraseFreq.values()).filter(f => f > 1).length;

  // 3. Passive Voice Detection
  const passivePatterns = [
    /\b(is|are|was|were|been|being)\s+\w+ed\b/gi,
    /\b(is|are|was|were|been|being)\s+\w+en\b/gi,
    /\bcan\s+be\s+\w+ed\b/gi,
    /\bwill\s+be\s+\w+ed\b/gi,
    /\bhas\s+been\s+\w+ed\b/gi,
    /\bhave\s+been\s+\w+ed\b/gi
  ];
  
  let passiveCount = 0;
  passivePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    passiveCount += matches ? matches.length : 0;
  });
  const passiveScore = Math.min(passiveCount / Math.max(sentences.length, 1), 1);

  // 4. Sentence Structure Variety
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((sum, len) => 
    sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
  const stdDev = Math.sqrt(variance);
  const sentenceVariety = Math.min(stdDev / Math.max(avgLength, 1), 1);

  // 5. Sentence Starter Pattern Detection
  const starters = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase()).filter(Boolean);
  const starterFreq = new Map();
  starters.forEach(starter => {
    starterFreq.set(starter, (starterFreq.get(starter) || 0) + 1);
  });
  const starterRepetition = Array.from(starterFreq.values()).filter(f => f > 2).length;
  const starterScore = Math.min(starterRepetition / Math.max(sentences.length, 1), 1);

  // 6. Contraction Analysis
  const contractionPattern = /\b(can't|won't|don't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|you're|we're|they're|it's|that's|I'm|I've|I'll|there's|who's|what's|where's|how's)\b/gi;
  const contractionCount = (text.match(contractionPattern) || []).length;
  const contractionScore = contractionCount / Math.max(sentences.length, 1);
  const lackOfContractions = contractionScore < 0.1 ? 0.8 : 0;

  // 7. Robotic Transitions Detection
  const roboticTransitions = [
    'furthermore', 'moreover', 'in conclusion', 'additionally', 'consequently',
    'subsequently', 'therefore', 'thus', 'hence', 'accordingly', 'nevertheless',
    'notwithstanding', 'it is important to note', 'it should be noted',
    'it is worth mentioning', 'in this regard', 'in light of', 'with respect to',
    'in terms of', 'with regard to', 'as previously mentioned'
  ];
  const transitionCount = roboticTransitions.filter(t => 
    text.toLowerCase().includes(t)
  ).length;
  const transitionScore = Math.min(transitionCount / 3, 1);

  // 8. Perfect Structure Detection
  const perfectStructureIndicators = [];
  if (sentences.length > 3 && sentences.every(s => s.trim().split(/\s+/).length > 15)) {
    perfectStructureIndicators.push(true);
  }
  if (sentences.length > 3 && sentences.every(s => s.includes(','))) {
    perfectStructureIndicators.push(true);
  }
  const perfectStructure = perfectStructureIndicators.length / 2;

  // 9. Vocabulary Diversity
  const uniqueWords = new Set(words);
  const vocabDiversity = uniqueWords.size / words.length;
  const lowDiversityScore = vocabDiversity < 0.5 ? 0.6 : 0;

  // 10. Paragraph Consistency
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  let paragraphConsistency = 0;
  if (paragraphs.length > 1) {
    const paraLengths = paragraphs.map(p => p.length);
    const paraAvg = paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length;
    const paraVariance = paraLengths.reduce((sum, len) => 
      sum + Math.pow(len - paraAvg, 2), 0) / paraLengths.length;
    paragraphConsistency = Math.sqrt(paraVariance) / paraAvg < 0.2 ? 0.5 : 0;
  }

  // Build pattern list
  if (formalityScore > 0.15) {
    aiPatterns.push(`High formality level detected (${(formalityScore * 100).toFixed(1)}%)`);
  }
  if (repetitionScore > 0.08) {
    aiPatterns.push(`Word repetition detected (${(repetitionScore * 100).toFixed(1)}%)`);
  }
  if (phraseRepetition > 3) {
    aiPatterns.push(`Phrase repetition detected (${phraseRepetition} repeated phrases)`);
  }
  if (passiveScore > 0.25) {
    aiPatterns.push(`Excessive passive voice (${passiveCount} instances)`);
  }
  if (sentenceVariety < 0.35) {
    aiPatterns.push(`Uniform sentence lengths (variety: ${(sentenceVariety * 100).toFixed(1)}%)`);
  }
  if (starterScore > 0.3) {
    aiPatterns.push(`Repetitive sentence starters detected`);
  }
  if (lackOfContractions > 0.5) {
    aiPatterns.push(`Lack of contractions (${contractionCount} found)`);
  }
  if (transitionCount > 0) {
    aiPatterns.push(`Robotic transitions detected (${transitionCount} found)`);
  }
  if (perfectStructure > 0.3) {
    aiPatterns.push(`Unnaturally perfect sentence structure`);
  }
  if (lowDiversityScore > 0.3) {
    aiPatterns.push(`Limited vocabulary diversity (${(vocabDiversity * 100).toFixed(1)}%)`);
  }
  if (paragraphConsistency > 0.3) {
    aiPatterns.push(`Suspiciously consistent paragraph lengths`);
  }

  // Calculate overall AI score
  const overallAIScore = Math.min(
    formalityScore * 0.20 +
    repetitionScore * 0.15 +
    passiveScore * 0.15 +
    (1 - sentenceVariety) * 0.15 +
    starterScore * 0.10 +
    lackOfContractions * 0.10 +
    transitionScore * 0.10 +
    lowDiversityScore * 0.05,
    1
  );

  return {
    aiPatterns,
    formalityScore,
    repetitionScore,
    passiveCount,
    passiveScore,
    sentenceVariety,
    starterScore,
    contractionScore,
    transitionScore,
    vocabDiversity,
    overallAIScore,
    detailedMetrics: {
      totalWords: words.length,
      totalSentences: sentences.length,
      avgSentenceLength: avgLength.toFixed(1),
      uniqueWordRatio: vocabDiversity.toFixed(2),
      contractionCount,
      passiveVoiceInstances: passiveCount
    }
  };
}

// ============================================
// HUMANIZATION ENGINE
// ============================================

function applyHumanization(text, tone, strength, analysis) {
  let result = text;
  const passes = strength === 'aggressive' ? 3 : strength === 'medium' ? 2 : 1;

  for (let pass = 0; pass < passes; pass++) {
    if (analysis.formalityScore > 0.1) {
      result = reduceFormality(result, tone, strength);
    }

    if (analysis.repetitionScore > 0.05) {
      result = reduceRepetition(result, strength);
    }

    if (analysis.passiveScore > 0.2) {
      result = convertPassiveToActive(result, strength);
    }

    if (analysis.sentenceVariety < 0.4) {
      result = varySentenceStructure(result, strength);
    }

    if (analysis.contractionScore < 0.2) {
      result = addContractions(result, strength);
    }

    result = removeRoboticTransitions(result);
    result = applyToneTransformations(result, tone, strength);
    result = addNaturalFlow(result, tone, strength);
    
    if (strength === 'aggressive') {
      result = injectPersonality(result, tone);
    }
  }

  result = finalPolish(result);
  return result;
}

function reduceFormality(text, tone, strength) {
  const baseReplacements = {
    'utilize': 'use',
    'implement': 'set up',
    'facilitate': 'help',
    'leverage': 'use',
    'optimize': 'improve',
    'strategic': 'smart',
    'comprehensive': 'complete',
    'methodology': 'approach',
    'framework': 'system',
    'paradigm': 'model',
    'in order to': 'to',
    'due to the fact that': 'because',
    'it is important to note': 'note that',
    'it should be noted': 'worth noting',
    'the majority of': 'most',
    'a significant number': 'many',
    'substantial': 'big',
    'numerous': 'many',
    'approximately': 'about',
    'regarding': 'about',
    'concerning': 'about',
    'pertaining to': 'about',
    'with respect to': 'about',
    'in light of': 'because of',
    'endeavor': 'try',
    'ascertain': 'find out',
    'procure': 'get',
    'subsequently': 'later',
    'therefore': 'so',
    'thus': 'so',
    'hence': 'so',
    'accordingly': 'so',
    'consequently': 'as a result',
    'nevertheless': 'but',
    'nonetheless': 'but',
    'notwithstanding': 'despite'
  };

  const aggressiveReplacements = {
    'demonstrate': 'show',
    'indicate': 'show',
    'illustrate': 'show',
    'establish': 'prove',
    'determine': 'figure out',
    'examine': 'look at',
    'analyze': 'break down',
    'evaluate': 'check out',
    'assess': 'judge',
    'investigate': 'look into',
    'commence': 'start',
    'terminate': 'end',
    'initiate': 'start',
    'conclude': 'end',
    'obtain': 'get',
    'acquire': 'get',
    'purchase': 'buy',
    'receive': 'get'
  };

  let result = text;
  const replacements = strength === 'aggressive' 
    ? { ...baseReplacements, ...aggressiveReplacements }
    : baseReplacements;

  Object.entries(replacements).forEach(([formal, casual]) => {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      const isCapitalized = match[0] === match[0].toUpperCase();
      return isCapitalized ? casual.charAt(0).toUpperCase() + casual.slice(1) : casual;
    });
  });

  return result;
}

function reduceRepetition(text, strength) {
  const words = text.split(/(\s+)/);
  const usedWords = new Map();
  const result = [];

  const synonymMap = {
    'important': ['key', 'crucial', 'vital', 'essential', 'critical'],
    'good': ['great', 'excellent', 'solid', 'strong', 'effective'],
    'bad': ['poor', 'weak', 'problematic', 'flawed', 'subpar'],
    'big': ['large', 'major', 'significant', 'substantial', 'huge'],
    'small': ['minor', 'tiny', 'limited', 'modest', 'slight'],
    'show': ['reveal', 'display', 'demonstrate', 'indicate', 'present'],
    'make': ['create', 'build', 'produce', 'generate', 'develop'],
    'get': ['obtain', 'acquire', 'receive', 'gain', 'secure'],
    'use': ['apply', 'employ', 'utilize', 'implement', 'deploy'],
    'think': ['believe', 'feel', 'consider', 'reckon', 'figure'],
    'say': ['state', 'mention', 'note', 'express', 'indicate'],
    'help': ['assist', 'support', 'aid', 'facilitate', 'enable'],
    'need': ['require', 'necessitate', 'demand', 'call for', 'want'],
    'want': ['desire', 'wish', 'prefer', 'seek', 'need']
  };

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const lowerWord = word.toLowerCase();
    const count = usedWords.get(lowerWord) || 0;

    if (count > 1 && synonymMap[lowerWord] && Math.random() < (strength === 'aggressive' ? 0.7 : 0.4)) {
      const synonyms = synonymMap[lowerWord];
      const synonym = synonyms[Math.floor(Math.random() * synonyms.length)];
      const isCapitalized = word[0] === word[0].toUpperCase();
      result.push(isCapitalized ? synonym.charAt(0).toUpperCase() + synonym.slice(1) : synonym);
    } else {
      result.push(word);
    }

    usedWords.set(lowerWord, count + 1);
  }

  return result.join('');
}

function convertPassiveToActive(text, strength) {
  let result = text;
  const intensity = strength === 'aggressive' ? 1 : strength === 'medium' ? 0.6 : 0.3;

  if (Math.random() > intensity) return result;

  const patterns = [
    {
      pattern: /(\w+)\s+(?:is|are)\s+(\w+ed)\s+by\s+(\w+)/gi,
      replacement: '$3 $2s $1'
    },
    {
      pattern: /(\w+)\s+(?:was|were)\s+(\w+ed)\s+by\s+(\w+)/gi,
      replacement: '$3 $2 $1'
    },
    {
      pattern: /it\s+(?:is|was)\s+(\w+ed)\s+that/gi,
      replacement: 'we $1 that'
    },
    {
      pattern: /(\w+)\s+(?:can|could)\s+be\s+(\w+ed)/gi,
      replacement: 'you can $2 $1'
    }
  ];

  patterns.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement);
  });

  return result;
}

function varySentenceStructure(text, strength) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const result = [];
  const intensity = strength === 'aggressive' ? 0.4 : strength === 'medium' ? 0.25 : 0.15;

  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i].trim();

    if (Math.random() < intensity) {
      const transforms = [
        () => addContraction(sentence),
        () => startWithConjunction(sentence),
        () => i > 0 && sentences.length > 2 && Math.random() < 0.3 ? combineSentences(result[result.length - 1], sentence) : sentence,
        () => sentence.split(/\s+/).length > 15 ? splitSentence(sentence) : sentence
      ];

      const transform = transforms[Math.floor(Math.random() * transforms.length)];
      const transformed = transform();
      
      if (transformed !== sentence && i > 0 && result.length > 0 && transformed.includes(result[result.length - 1])) {
        result[result.length - 1] = transformed;
        continue;
      }
      
      sentence = transformed;
    }

    result.push(sentence);
  }

  return result.join(' ');
}

function addContractions(text, strength) {
  const contractions = [
    { pattern: /\bI am\b/g, replacement: "I'm" },
    { pattern: /\byou are\b/g, replacement: "you're" },
    { pattern: /\bwe are\b/g, replacement: "we're" },
    { pattern: /\bthey are\b/g, replacement: "they're" },
    { pattern: /\bit is\b/g, replacement: "it's" },
    { pattern: /\bthat is\b/g, replacement: "that's" },
    { pattern: /\bwhat is\b/g, replacement: "what's" },
    { pattern: /\bwho is\b/g, replacement: "who's" },
    { pattern: /\bdo not\b/g, replacement: "don't" },
    { pattern: /\bdoes not\b/g, replacement: "doesn't" },
    { pattern: /\bdid not\b/g, replacement: "didn't" },
    { pattern: /\bcannot\b/g, replacement: "can't" },
    { pattern: /\bcould not\b/g, replacement: "couldn't" },
    { pattern: /\bwould not\b/g, replacement: "wouldn't" },
    { pattern: /\bshould not\b/g, replacement: "shouldn't" },
    { pattern: /\bwill not\b/g, replacement: "won't" },
    { pattern: /\bhave not\b/g, replacement: "haven't" },
    { pattern: /\bhas not\b/g, replacement: "hasn't" },
    { pattern: /\bhad not\b/g, replacement: "hadn't" },
    { pattern: /\bis not\b/g, replacement: "isn't" },
    { pattern: /\bare not\b/g, replacement: "aren't" },
    { pattern: /\bwas not\b/g, replacement: "wasn't" },
    { pattern: /\bwere not\b/g, replacement: "weren't" }
  ];

  let result = text;
  const intensity = strength === 'aggressive' ? 1 : strength === 'medium' ? 0.7 : 0.5;

  contractions.forEach(({ pattern, replacement }) => {
    if (Math.random() < intensity) {
      result = result.replace(pattern, replacement);
    }
  });

  return result;
}

function addContraction(sentence) {
  return addContractions(sentence, 'medium');
}

function startWithConjunction(sentence) {
  const conjunctions = ['And', 'But', 'Or', 'So', 'Yet', 'Because'];
  if (Math.random() < 0.3 && /^[A-Z]/.test(sentence)) {
    const conj = conjunctions[Math.floor(Math.random() * conjunctions.length)];
    return `${conj} ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
  }
  return sentence;
}

function combineSentences(sent1, sent2) {
  if (!sent1 || !sent2) return sent2 || sent1;
  const connectors = [', and', ', but', ', so', ', yet', ' - ', ';'];
  const connector = connectors[Math.floor(Math.random() * connectors.length)];
  return sent1.replace(/[.!?]+$/, '') + connector + ' ' + sent2.charAt(0).toLowerCase() + sent2.slice(1);
}

function splitSentence(sentence) {
  const words = sentence.split(/\s+/);
  if (words.length > 15) {
    const midpoint = Math.floor(words.length / 2);
    const firstPart = words.slice(0, midpoint).join(' ');
    const secondPart = words.slice(midpoint).join(' ');
    return firstPart + '. ' + secondPart.charAt(0).toUpperCase() + secondPart.slice(1);
  }
  return sentence;
}

function removeRoboticTransitions(text) {
  const replacements = {
    'furthermore,': 'plus,',
    'moreover,': 'also,',
    'in conclusion,': 'so,',
    'additionally,': 'also,',
    'consequently,': 'so,',
    'subsequently,': 'later,',
    'therefore,': 'so,',
    'thus,': 'so,',
    'hence,': 'so,',
    'accordingly,': 'so,',
    'nevertheless,': 'but,',
    'nonetheless,': 'but,',
    'it is important to note that': 'note that',
    'it should be noted that': 'worth noting that',
    'it is worth mentioning that': 'worth mentioning that'
  };

  let result = text;
  Object.entries(replacements).forEach(([robotic, natural]) => {
    const regex = new RegExp(robotic, 'gi');
    result = result.replace(regex, natural);
  });

  return result;
}

function applyToneTransformations(text, tone, strength) {
  switch (tone) {
    case 'casual':
      return makeCasual(text, strength);
    case 'professional':
      return makeProfessional(text, strength);
    case 'academic':
      return makeAcademic(text, strength);
    case 'creative':
      return makeCreative(text, strength);
    default:
      return text;
  }
}

function makeCasual(text, strength) {
  let result = text;
  const markers = ['honestly', 'look', 'you know', 'like', 'actually', 'basically', 'literally', 'seriously'];
  const sentences = result.match(/[^.!?]+[.!?]+/g) || [result];
  const processed = [];

  const intensity = strength === 'aggressive' ? 0.25 : strength === 'medium' ? 0.15 : 0.1;

  for (const sentence of sentences) {
    if (Math.random() < intensity) {
      const marker = markers[Math.floor(Math.random() * markers.length)];
      processed.push(marker + ', ' + sentence.charAt(0).toLowerCase() + sentence.slice(1));
    } else {
      processed.push(sentence);
    }
  }

  return processed.join(' ');
}

function makeProfessional(text, strength) {
  let result = text;
  result = result.replace(/\bkinda\b/gi, 'somewhat');
  result = result.replace(/\bgonna\b/gi, 'going to');
  result = result.replace(/\bwanna\b/gi, 'want to');
  result = result.replace(/\byeah\b/gi, 'yes');
  result = result.replace(/\bnope\b/gi, 'no');
  return result;
}

function makeAcademic(text, strength) {
  const markers = ['interestingly', 'notably', "it's worth noting", 'this suggests', 'significantly', 'evidently'];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const processed = [];

  const intensity = strength === 'aggressive' ? 0.15 : strength === 'medium' ? 0.1 : 0.05;

  for (const sentence of sentences) {
    if (Math.random() < intensity) {
      const marker = markers[Math.floor(Math.random() * markers.length)];
      processed.push(marker + ', ' + sentence.charAt(0).toLowerCase() + sentence.slice(1));
    } else {
      processed.push(sentence);
    }
  }

  return processed.join(' ');
}

function makeCreative(text, strength) {
  const markers = ['imagine', 'picture this', "here's what's interesting", 'the beauty is', 'get this', 'check it out'];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const processed = [];

  const intensity = strength === 'aggressive' ? 0.2 : strength === 'medium' ? 0.12 : 0.08;

  for (const sentence of sentences) {
    if (Math.random() < intensity) {
      const marker = markers[Math.floor(Math.random() * markers.length)];
      processed.push(marker + ' - ' + sentence.charAt(0).toLowerCase() + sentence.slice(1));
    } else {
      processed.push(sentence);
    }
  }

  return processed.join(' ');
}

function addNaturalFlow(text, tone, strength) {
  let result = text;

  const emphasisWords = {
    casual: ['really', 'actually', 'honestly', 'totally', 'definitely', 'pretty'],
    professional: ['certainly', 'indeed', 'clearly', 'notably', 'particularly'],
    academic: ['significantly', 'particularly', 'notably', 'especially', 'considerably'],
    creative: ['incredibly', 'amazingly', 'beautifully', 'remarkably', 'strikingly']
  };

  const words = emphasisWords[tone] || emphasisWords.casual;
  const intensity = strength === 'aggressive' ? 0.15 : strength === 'medium' ? 0.1 : 0.05;

  result = result.replace(/\b(is|are|was|were|has|have)\b/gi, (match) => {
    return Math.random() < intensity ? words[Math.floor(Math.random() * words.length)] + ' ' + match : match;
  });

  return result;
}

function injectPersonality(text, tone) {
  const personalTouches = {
    casual: ["Let me tell you", "Here's the deal", "The thing is", "You see"],
    professional: ["It's important to understand", "Consider this", "What we're seeing is"],
    academic: ["It bears mentioning", "One must consider", "The evidence suggests"],
    creative: ["Here's what's wild", "The fascinating part is", "You won't believe this"]
  };

  const touches = personalTouches[tone] || personalTouches.casual;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  if (sentences.length > 2 && Math.random() < 0.3) {
    const insertPoint = Math.floor(Math.random() * sentences.length);
    const touch = touches[Math.floor(Math.random() * touches.length)];
    sentences[insertPoint] = touch + ' - ' + sentences[insertPoint].charAt(0).toLowerCase() + sentences[insertPoint].slice(1);
  }

  return sentences.join(' ');
}

function finalPolish(text) {
  let result = text;

  result = result.replace(/\s+/g, ' ');
  result = result.replace(/\s+([.,!?;:])/g, '$1');
  result = result.replace(/([.,!?;:])\s*/g, '$1 ');
  result = result.replace(/\.+/g, '.');
  result = result.replace(/\?+/g, '?');
  result = result.replace(/!+/g, '!');
  result = result.replace(/([.!?]\s+)(\w)/g, (match, punct, letter) => punct + letter.toUpperCase());
  result = result.charAt(0).toUpperCase() + result.slice(1);
  result = result.replace(/\s+-\s+/g, ' - ');
  result = result.replace(/\s+,/g, ',');
  result = result.replace(/\s+\./g, '.');

  return result.trim();
}

// ============================================
// CLI INTERFACE
// ============================================

function printBanner() {
  console.log(`
===============================================================
           AI TEXT HUMANIZER CLI v2.0 - PRODUCTION           
              Advanced Pattern Detection Engine              
===============================================================
`);
}

function printUsage() {
  console.log(`
USAGE:
  humanizer [options] [text]

OPTIONS:
  -i, --input <file>       Input file to humanize
  -o, --output <file>      Output file (default: stdout)
  -t, --tone <tone>        Tone: casual, professional, academic, creative
  -s, --strength <level>   Strength: light, medium, aggressive (default: medium)
  -p, --passes <num>       Number of processing passes (1-5, default: 2)
  -a, --analyze            Show detailed AI pattern analysis
  -c, --compare            Show before/after comparison
  -v, --verbose            Verbose output with processing details
  -h, --help               Show this help

TONE OPTIONS:
  casual        - Conversational, friendly, uses contractions
  professional  - Business-appropriate, confident tone
  academic      - Scholarly, intellectual, formal style
  creative      - Imaginative, engaging, storytelling approach

STRENGTH LEVELS:
  light         - Minimal changes, preserve most structure
  medium        - Balanced transformation (recommended)
  aggressive    - Maximum humanization, bold changes

EXAMPLES:
  humanizer "This is AI generated text"
  humanizer -i input.txt -o output.txt -t professional -s aggressive
  humanizer -a "Text to analyze"
  humanizer -i input.txt -s aggressive -p 3 -c
  cat input.txt | humanizer -t casual -s medium

PRO TIPS:
  - Use multiple passes (-p 3) for maximum undetectability
  - Aggressive strength works best for formal AI text
  - Always analyze first to understand AI patterns
  - Casual tone has highest humanization success rate
`);
}

function parseArgs(args) {
  const options = {
    input: null,
    output: null,
    tone: 'casual',
    strength: 'medium',
    passes: 2,
    analyze: false,
    compare: false,
    verbose: false,
    text: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-i':
      case '--input':
        options.input = args[++i];
        break;
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '-t':
      case '--tone':
        const tone = args[++i]?.toLowerCase();
        if (!['casual', 'professional', 'academic', 'creative'].includes(tone)) {
          console.error(`ERROR: Invalid tone: ${tone}. Use: casual, professional, academic, or creative`);
          process.exit(1);
        }
        options.tone = tone;
        break;
      case '-s':
      case '--strength':
        const strength = args[++i]?.toLowerCase();
        if (!['light', 'medium', 'aggressive'].includes(strength)) {
          console.error(`ERROR: Invalid strength: ${strength}. Use: light, medium, or aggressive`);
          process.exit(1);
        }
        options.strength = strength;
        break;
      case '-p':
      case '--passes':
        const passes = parseInt(args[++i]);
        if (isNaN(passes) || passes < 1 || passes > 5) {
          console.error('ERROR: Passes must be between 1 and 5');
          process.exit(1);
        }
        options.passes = passes;
        break;
      case '-a':
      case '--analyze':
        options.analyze = true;
        break;
      case '-c':
      case '--compare':
        options.compare = true;
        break;
      case '-v':
      case '--verbose':
        options.verbose = true;
        break;
      case '-h':
      case '--help':
        printBanner();
        printUsage();
        process.exit(0);
      default:
        if (!arg.startsWith('-')) {
          options.text = args.slice(i).join(' ');
          i = args.length;
        }
        break;
    }
  }

  return options;
}

function printAnalysis(analysis, verbose = false) {
  const score = analysis.overallAIScore;
  const confidenceLevel = score > 0.7 ? 'VERY HIGH' : 
                          score > 0.5 ? 'HIGH' : 
                          score > 0.3 ? 'MODERATE' : 
                          'LOW';

  console.log('\n---------------------------------------------------------------');
  console.log('                   AI PATTERN ANALYSIS                         ');
  console.log('---------------------------------------------------------------');
  console.log(`\n  AI Detection Confidence: ${confidenceLevel} (${(score * 100).toFixed(1)}%)`);
  
  console.log('\n  Core Metrics:');
  console.log(`     Formality Score:     ${(analysis.formalityScore * 100).toFixed(1)}%`);
  console.log(`     Repetition Score:    ${(analysis.repetitionScore * 100).toFixed(1)}%`);
  console.log(`     Passive Voice Score: ${(analysis.passiveScore * 100).toFixed(1)}%`);
  console.log(`     Sentence Variety:    ${(analysis.sentenceVariety * 100).toFixed(1)}%`);
  console.log(`     Contraction Usage:   ${(analysis.contractionScore * 100).toFixed(1)}%`);
  console.log(`     Vocab Diversity:     ${(analysis.vocabDiversity * 100).toFixed(1)}%`);

  if (verbose) {
    console.log('\n  Detailed Metrics:');
    console.log(`     Total Words:         ${analysis.detailedMetrics.totalWords}`);
    console.log(`     Total Sentences:     ${analysis.detailedMetrics.totalSentences}`);
    console.log(`     Avg Sentence Length: ${analysis.detailedMetrics.avgSentenceLength} words`);
    console.log(`     Unique Word Ratio:   ${analysis.detailedMetrics.uniqueWordRatio}`);
    console.log(`     Contractions Found:  ${analysis.detailedMetrics.contractionCount}`);
    console.log(`     Passive Instances:   ${analysis.detailedMetrics.passiveVoiceInstances}`);
  }

  if (analysis.aiPatterns.length > 0) {
    console.log('\n  Detected AI Patterns:');
    analysis.aiPatterns.forEach(pattern => console.log(`     - ${pattern}`));
  } else {
    console.log('\n  No obvious AI patterns detected');
  }

  console.log('');
}

function printComparison(original, humanized) {
  const maxLength = 500;
  const origPreview = original.length > maxLength ? original.substring(0, maxLength) + '...' : original;
  const humanPreview = humanized.length > maxLength ? humanized.substring(0, maxLength) + '...' : humanized;

  console.log('\n---------------------------------------------------------------');
  console.log('                 BEFORE / AFTER COMPARISON                     ');
  console.log('---------------------------------------------------------------');
  
  console.log('\nORIGINAL (AI-like):');
  console.log('---------------------------------------------------------------');
  console.log(origPreview);
  console.log('---------------------------------------------------------------');
  
  console.log('\nHUMANIZED:');
  console.log('---------------------------------------------------------------');
  console.log(humanPreview);
  console.log('---------------------------------------------------------------');

  const origWords = original.split(/\s+/).length;
  const humanWords = humanized.split(/\s+/).length;
  const wordDiff = humanWords - origWords;
  const lengthChange = ((wordDiff / origWords) * 100).toFixed(1);

  console.log('\nChanges:');
  console.log(`   Word count: ${origWords} -> ${humanWords} (${wordDiff > 0 ? '+' : ''}${wordDiff}, ${lengthChange}%)`);
  console.log(`   Character count: ${original.length} -> ${humanized.length}`);
}

function printProgress(pass, totalPasses, stage) {
  console.log(`   Pass ${pass}/${totalPasses}: ${stage}`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printBanner();
    printUsage();
    process.exit(0);
  }

  const options = parseArgs(args);
  let inputText = options.text;

  if (options.input) {
    try {
      inputText = readFileSync(resolve(options.input), 'utf8');
      if (options.verbose) {
        console.log(`Loaded ${inputText.length} characters from ${options.input}`);
      }
    } catch (error) {
      console.error(`ERROR: Failed to read input file: ${error.message}`);
      process.exit(1);
    }
  }

  if (!inputText) {
    if (process.stdin.isTTY) {
      printBanner();
      printUsage();
      process.exit(1);
    }

    let stdinData = '';
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', chunk => {
      stdinData += chunk;
    });

    process.stdin.on('end', () => {
      processText(stdinData, options);
    });
    
    return;
  }

  processText(inputText, options);
}

function processText(text, options) {
  if (!text || text.trim().length === 0) {
    console.error('ERROR: No text provided to humanize');
    process.exit(1);
  }

  printBanner();

  console.log('Analyzing text for AI patterns...');
  const startTime = Date.now();
  const analysis = analyzeAIPatterns(text);

  if (options.analyze || options.verbose) {
    printAnalysis(analysis, options.verbose);
  } else {
    const score = analysis.overallAIScore;
    const level = score > 0.7 ? 'VERY HIGH' : score > 0.5 ? 'HIGH' : score > 0.3 ? 'MODERATE' : 'LOW';
    console.log(`   AI Confidence: ${level} (${(score * 100).toFixed(1)}%)`);
    console.log(`   Patterns Found: ${analysis.aiPatterns.length}`);
  }

  console.log(`\nHumanizing with ${options.passes} pass(es)...`);
  console.log(`   Tone: ${options.tone.toUpperCase()}`);
  console.log(`   Strength: ${options.strength.toUpperCase()}`);
  console.log('');

  let result = text;
  for (let i = 1; i <= options.passes; i++) {
    if (options.verbose) {
      printProgress(i, options.passes, 'Processing');
    }
    result = applyHumanization(result, options.tone, options.strength, analysis);
  }

  const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

  const finalAnalysis = analyzeAIPatterns(result);
  const improvement = ((analysis.overallAIScore - finalAnalysis.overallAIScore) / analysis.overallAIScore * 100).toFixed(1);

  console.log('Humanization complete');
  console.log(`   Processing time: ${processingTime}s`);
  console.log(`   AI score reduced: ${(analysis.overallAIScore * 100).toFixed(1)}% -> ${(finalAnalysis.overallAIScore * 100).toFixed(1)}%`);
  console.log(`   Improvement: ${improvement}%`);

  if (options.compare) {
    printComparison(text, result);
  }

  if (options.output) {
    try {
      writeFileSync(resolve(options.output), result, 'utf8');
      console.log(`\nSaved to: ${options.output}`);
    } catch (error) {
      console.error(`\nERROR: Failed to write output file: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log('\n---------------------------------------------------------------');
    console.log('                      HUMANIZED TEXT                           ');
    console.log('---------------------------------------------------------------\n');
    console.log(result);
    console.log('\n---------------------------------------------------------------');
  }

  if (finalAnalysis.overallAIScore > 0.3 && !options.verbose) {
    console.log('\nRECOMMENDATION: AI score still moderate. Consider:');
    console.log('   - Increase passes: -p 3');
    console.log('   - Use aggressive strength: -s aggressive');
    console.log('   - Try casual tone: -t casual');
  }

  console.log('\nDone. Use -h for more options.\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { 
  analyzeAIPatterns, 
  applyHumanization,
  reduceFormality,
  reduceRepetition,
  convertPassiveToActive,
  varySentenceStructure,
  addContractions,
  removeRoboticTransitions,
  finalPolish
};
