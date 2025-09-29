#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api/v1';

// 실행 시간 측정 유틸리티
function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// 내용을 파일로 저장하는 함수
async function saveContentToFile(content, filename) {
  const resultsDir = path.join(__dirname, 'test-results');

  // 디렉토리가 없으면 생성
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const filepath = path.join(resultsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(content, null, 2), 'utf8');
  return filepath;
}

// 내용 미리보기 (너무 길면 자름)
function getContentPreview(text, maxLength = 200) {
  if (!text) return '(내용 없음)';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// URL에서 도메인 추출
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

async function testParser() {
  const totalStartTime = Date.now();
  console.log('🚀 LinkRadio 파싱 서버 테스트 시작 (향상된 버전)\n');

  try {
    // 1. 헬스체크
    console.log('1. 헬스체크...');
    const healthStartTime = Date.now();
    const healthResponse = await axios.get(`${API_BASE}/health`);
    const healthTime = Date.now() - healthStartTime;

    console.log('✅ 서버 상태:', healthResponse.data.parsers);
    console.log('📋 사용 가능한 전략:', healthResponse.data.strategies);
    console.log(`⏱️  헬스체크 시간: ${formatTime(healthTime)}`);
    console.log('');

    // 2. 테스트 URL들
    const testUrls = [
      'https://www.linkedin.com/posts/iceman88_ai-%EB%AA%A8%EB%8D%B8-%EB%B0%94%EA%BF%80-%EB%95%8C%EB%A7%88%EB%8B%A4-%ED%94%84%EB%A1%AC%ED%94%84%ED%8A%B8-%EC%83%88%EB%A1%9C-%EC%A7%9C%EC%95%BC-%ED%95%98%EB%8A%94-%EC%9D%B4%EC%9C%A0-%EB%8D%94-%EC%A2%8B%EC%9D%80-%EB%AA%A8%EB%8D%B8%EC%9D%B8%EB%8D%B0-activity-7374577996868988928-uDCt?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEPAERsBgBc-WGdmkLosbDIg3yaEbFmoi9Y',
      'https://medium.com/29cm/%EC%85%80%EB%A0%89%ED%8A%B8%EC%83%B5%EC%97%90%EC%84%9C-%EC%98%88%EC%95%BD%ED%95%98%EA%B8%B0-%EC%84%9C%EB%B9%84%EC%8A%A4-%EA%B0%9C%EB%B0%9C%EA%B8%B0-f7578ffcfbf7',
      'https://nx006.tistory.com/81',
    ];

    const allResults = [];

    // 3. 단일 URL 테스트
    console.log('2. 단일 URL 파싱 테스트...');
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i];
      const domain = getDomain(url);

      try {
        console.log(`🔍 파싱 중 (${i + 1}/${testUrls.length}): ${domain}`);
        console.log(`   URL: ${url}`);

        const requestStartTime = Date.now();
        const parseResponse = await axios.post(`${API_BASE}/parse`, { url });
        const requestTime = Date.now() - requestStartTime;

        const { content, metadata } = parseResponse.data.data;

        console.log(`✅ 성공!`);
        console.log(`   📖 제목: ${content.title}`);
        console.log(`   📝 내용 길이: ${content.content.length.toLocaleString()}자`);
        console.log(`   ⏱️  파싱 시간: ${formatTime(content.parsingTime)} (서버)`);
        console.log(`   🌐 요청 시간: ${formatTime(requestTime)} (전체)`);
        console.log(`   🎯 신뢰도: ${content.confidence}%`);
        console.log(`   👤 작성자: ${content.author || '없음'}`);
        console.log(`   🌍 언어: ${content.language}`);
        console.log(`   🔗 링크 수: ${content.links ? content.links.length : 0}개`);
        console.log(`   🖼️  이미지 수: ${content.images ? content.images.length : 0}개`);

        // 내용 미리보기
        console.log(`   💬 내용 미리보기:`);
        console.log(`      ${getContentPreview(content.content, 300)}`);

        // 상세 결과를 파일로 저장
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${domain}_${timestamp}.json`;
        const filepath = await saveContentToFile({
          url,
          domain,
          requestTime,
          timestamp: new Date().toISOString(),
          ...parseResponse.data
        }, filename);
        console.log(`📄 상세 결과 저장: ${path.basename(filepath)}`);
        console.log('');

        allResults.push({
          url,
          domain,
          success: true,
          title: content.title,
          contentLength: content.content.length,
          parsingTime: content.parsingTime,
          requestTime,
          confidence: content.confidence,
          author: content.author,
          linksCount: content.links ? content.links.length : 0,
          imagesCount: content.images ? content.images.length : 0
        });

      } catch (error) {
        const requestTime = Date.now() - requestStartTime;
        console.log(`❌ 실패: ${domain}`);
        console.log(`   에러: ${error.response?.data?.message || error.message}`);
        console.log(`   요청 시간: ${formatTime(requestTime)}`);
        console.log('');

        allResults.push({
          url,
          domain,
          success: false,
          error: error.response?.data?.message || error.message,
          requestTime
        });
      }
    }

    // 4. 배치 파싱 테스트
    console.log('3. 배치 파싱 테스트...');
    try {
      const batchStartTime = Date.now();
      const batchResponse = await axios.post(`${API_BASE}/parse/batch`, {
        urls: testUrls.map(url => ({ url }))
      });
      const batchTime = Date.now() - batchStartTime;

      const { results, summary } = batchResponse.data.data;
      console.log(`✅ 배치 파싱 완료!`);
      console.log(`   총 ${summary.total}개 중 ${summary.successful}개 성공`);
      console.log(`   배치 처리 시간: ${formatTime(batchTime)}`);

      results.forEach((result, index) => {
        if (result.success) {
          console.log(`   ${index + 1}. ✅ ${getDomain(result.url)} - ${result.data.title}`);
        } else {
          console.log(`   ${index + 1}. ❌ ${getDomain(result.url)} - ${result.error}`);
        }
      });

      // 배치 결과도 저장
      const batchTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const batchFilename = `batch_results_${batchTimestamp}.json`;
      await saveContentToFile({
        summary,
        results,
        batchProcessingTime: batchTime,
        timestamp: new Date().toISOString()
      }, batchFilename);
      console.log(`📄 배치 결과 저장: ${batchFilename}`);

    } catch (error) {
      console.log(`❌ 배치 파싱 실패: ${error.response?.data?.message || error.message}`);
    }

    // 5. 성능 요약
    const totalTime = Date.now() - totalStartTime;
    console.log('\n📊 성능 요약:');
    console.log(`   전체 테스트 시간: ${formatTime(totalTime)}`);

    const successfulResults = allResults.filter(r => r.success);
    if (successfulResults.length > 0) {
      const avgParsingTime = successfulResults.reduce((acc, r) => acc + r.parsingTime, 0) / successfulResults.length;
      const avgRequestTime = successfulResults.reduce((acc, r) => acc + r.requestTime, 0) / successfulResults.length;
      const totalContentLength = successfulResults.reduce((acc, r) => acc + r.contentLength, 0);

      console.log(`   성공률: ${successfulResults.length}/${allResults.length} (${((successfulResults.length/allResults.length)*100).toFixed(1)}%)`);
      console.log(`   평균 파싱 시간: ${formatTime(avgParsingTime)}`);
      console.log(`   평균 요청 시간: ${formatTime(avgRequestTime)}`);
      console.log(`   총 추출된 텍스트: ${totalContentLength.toLocaleString()}자`);

      console.log('\n📈 사이트별 결과:');
      successfulResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.domain}: ${formatTime(result.parsingTime)} (${result.contentLength.toLocaleString()}자)`);
      });
    }

    // 전체 결과 요약 저장
    const summaryTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const summaryFilename = `test_summary_${summaryTimestamp}.json`;
    await saveContentToFile({
      testStartTime: new Date(totalStartTime).toISOString(),
      testEndTime: new Date().toISOString(),
      totalTestTime: totalTime,
      results: allResults,
      summary: {
        totalTests: allResults.length,
        successful: successfulResults.length,
        failed: allResults.length - successfulResults.length,
        successRate: (successfulResults.length/allResults.length)*100,
        avgParsingTime: successfulResults.length > 0 ? successfulResults.reduce((acc, r) => acc + r.parsingTime, 0) / successfulResults.length : 0,
        avgRequestTime: successfulResults.length > 0 ? successfulResults.reduce((acc, r) => acc + r.requestTime, 0) / successfulResults.length : 0,
        totalContentLength: successfulResults.reduce((acc, r) => acc + r.contentLength, 0)
      }
    }, summaryFilename);

    console.log(`\n📄 전체 요약 저장: ${summaryFilename}`);
    console.log('\n🎉 향상된 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 서버가 실행 중인지 확인하세요: npm start');
    }
  }
}

// 실행
testParser();