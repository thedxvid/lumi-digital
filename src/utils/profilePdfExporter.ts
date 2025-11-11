import jsPDF from 'jspdf';
import type { ProfileAnalysisOutput } from '@/types/profile';

export function exportProfileAnalysisToPDF(
  result: ProfileAnalysisOutput,
  platform?: string,
  profileImage?: string
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper para texto com quebra de linha
  const addText = (text: string, fontSize: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [0, 0, 0]) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', style);
    pdf.setTextColor(color[0], color[1], color[2]);
    const lines = pdf.splitTextToSize(text, contentWidth);
    
    lines.forEach((line: string) => {
      checkPageBreak(fontSize / 2);
      pdf.text(line, margin, yPosition);
      yPosition += fontSize / 2;
    });
  };

  // Header
  pdf.setFillColor(99, 102, 241); // primary color
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Análise de Perfil', margin, 25);
  
  if (platform) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Plataforma: ${platform}`, margin, 33);
  }

  yPosition = 50;

  // Pontuação Geral - Gráfico Circular
  const scoreX = pageWidth / 2;
  const scoreY = yPosition + 30;
  const scoreRadius = 25;

  pdf.setFillColor(240, 240, 245);
  pdf.circle(scoreX, scoreY, scoreRadius + 2, 'F');

  const scorePercentage = result.pontuacao_geral / 100;
  const scoreColor: [number, number, number] = 
    result.pontuacao_geral >= 80 ? [34, 197, 94] : // green
    result.pontuacao_geral >= 60 ? [234, 179, 8] : // yellow
    [239, 68, 68]; // red

  pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  
  // Desenhar arco (simulando progresso circular)
  const startAngle = -90;
  const endAngle = startAngle + (360 * scorePercentage);
  
  for (let angle = startAngle; angle <= endAngle; angle += 2) {
    const rad = (angle * Math.PI) / 180;
    const x = scoreX + scoreRadius * Math.cos(rad);
    const y = scoreY + scoreRadius * Math.sin(rad);
    pdf.circle(x, y, 2, 'F');
  }

  // Pontuação no centro
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  const scoreText = result.pontuacao_geral.toString();
  const scoreTextWidth = pdf.getTextWidth(scoreText);
  pdf.text(scoreText, scoreX - scoreTextWidth / 2, scoreY + 3);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const labelText = '/100';
  const labelTextWidth = pdf.getTextWidth(labelText);
  pdf.text(labelText, scoreX - labelTextWidth / 2, scoreY + 10);

  yPosition = scoreY + scoreRadius + 15;

  // Resumo Executivo
  checkPageBreak(30);
  pdf.setFillColor(99, 102, 241, 0.1);
  pdf.rect(margin, yPosition, contentWidth, 8, 'F');
  
  pdf.setTextColor(99, 102, 241);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📋 Resumo Executivo', margin + 2, yPosition + 6);
  yPosition += 12;

  addText(result.resumo_executivo, 10, 'normal', [60, 60, 60]);
  yPosition += 5;

  // Análise Visual
  checkPageBreak(30);
  pdf.setFillColor(99, 102, 241, 0.1);
  pdf.rect(margin, yPosition, contentWidth, 8, 'F');
  
  pdf.setTextColor(99, 102, 241);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('👁️ Análise Visual', margin + 2, yPosition + 6);
  yPosition += 12;

  const visualSections = [
    { title: 'Foto de Perfil', content: result.analise_visual.foto_perfil },
    { title: 'Bio', content: result.analise_visual.bio },
    { title: 'Destaques', content: result.analise_visual.destaques },
    { title: 'Elementos Visuais', content: result.analise_visual.elementos_visuais },
  ];

  visualSections.forEach(section => {
    checkPageBreak(20);
    addText(`${section.title}:`, 11, 'bold', [0, 0, 0]);
    yPosition += 2;
    addText(section.content, 9, 'normal', [60, 60, 60]);
    yPosition += 3;
  });

  // Pontos Fortes
  checkPageBreak(30);
  pdf.setFillColor(34, 197, 94, 0.1);
  pdf.rect(margin, yPosition, contentWidth, 8, 'F');
  
  pdf.setTextColor(34, 197, 94);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('✅ Pontos Fortes', margin + 2, yPosition + 6);
  yPosition += 12;

  result.pontos_fortes.forEach((ponto, index) => {
    checkPageBreak(15);
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(12);
    pdf.text('•', margin, yPosition);
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    const pontoLines = pdf.splitTextToSize(ponto, contentWidth - 5);
    pontoLines.forEach((line: string) => {
      pdf.text(line, margin + 5, yPosition);
      yPosition += 5;
    });
    yPosition += 2;
  });

  // Pontos Cegos
  checkPageBreak(30);
  pdf.setFillColor(239, 68, 68, 0.1);
  pdf.rect(margin, yPosition, contentWidth, 8, 'F');
  
  pdf.setTextColor(239, 68, 68);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('⚠️ Pontos Cegos', margin + 2, yPosition + 6);
  yPosition += 12;

  result.pontos_cegos.forEach((ponto, index) => {
    checkPageBreak(25);
    
    // Badge de impacto
    const impactColors: Record<string, [number, number, number]> = {
      alto: [239, 68, 68],
      medio: [234, 179, 8],
      baixo: [156, 163, 175],
    };
    const color = impactColors[ponto.impacto] || [156, 163, 175];
    
    pdf.setFillColor(color[0], color[1], color[2], 0.2);
    pdf.roundedRect(margin, yPosition, 25, 5, 1, 1, 'F');
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(ponto.impacto.toUpperCase(), margin + 2, yPosition + 3.5);
    
    yPosition += 8;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    addText(ponto.titulo, 11, 'bold', [0, 0, 0]);
    yPosition += 2;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    addText(ponto.descricao, 9, 'normal', [60, 60, 60]);
    yPosition += 2;
    
    pdf.setFillColor(245, 245, 250);
    const solutionHeight = pdf.splitTextToSize(ponto.solucao, contentWidth - 10).length * 4.5 + 8;
    checkPageBreak(solutionHeight);
    pdf.roundedRect(margin, yPosition, contentWidth, solutionHeight, 2, 2, 'F');
    
    pdf.setTextColor(99, 102, 241);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('💡 Solução:', margin + 3, yPosition + 5);
    yPosition += 7;
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const solutionLines = pdf.splitTextToSize(ponto.solucao, contentWidth - 10);
    solutionLines.forEach((line: string) => {
      pdf.text(line, margin + 3, yPosition);
      yPosition += 4.5;
    });
    
    yPosition += 5;
  });

  // Recomendações Prioritárias
  checkPageBreak(30);
  pdf.setFillColor(99, 102, 241, 0.1);
  pdf.rect(margin, yPosition, contentWidth, 8, 'F');
  
  pdf.setTextColor(99, 102, 241);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('🎯 Recomendações Prioritárias', margin + 2, yPosition + 6);
  yPosition += 12;

  result.recomendacoes_prioritarias
    .sort((a, b) => a.prioridade - b.prioridade)
    .forEach((rec) => {
      checkPageBreak(30);
      
      // Número de prioridade
      pdf.setFillColor(99, 102, 241);
      pdf.circle(margin + 4, yPosition + 3, 4, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const numText = rec.prioridade.toString();
      const numWidth = pdf.getTextWidth(numText);
      pdf.text(numText, margin + 4 - numWidth / 2, yPosition + 4);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const actionLines = pdf.splitTextToSize(rec.acao, contentWidth - 15);
      actionLines.forEach((line: string) => {
        pdf.text(line, margin + 10, yPosition + 4);
        yPosition += 5;
      });
      
      yPosition += 2;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      addText(rec.justificativa, 9, 'normal', [60, 60, 60]);
      yPosition += 2;
      
      pdf.setTextColor(99, 102, 241);
      pdf.setFontSize(8);
      pdf.text(`📈 ${rec.impacto_esperado} • ⏱️ ${rec.tempo_implementacao}`, margin + 10, yPosition);
      yPosition += 8;
    });

  // Plano de Ação 30 Dias
  checkPageBreak(30);
  pdf.setFillColor(99, 102, 241, 0.1);
  pdf.rect(margin, yPosition, contentWidth, 8, 'F');
  
  pdf.setTextColor(99, 102, 241);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📅 Plano de Ação 30 Dias', margin + 2, yPosition + 6);
  yPosition += 12;

  const weeks = [
    { key: 'semana_1', label: 'Semana 1' },
    { key: 'semana_2', label: 'Semana 2' },
    { key: 'semana_3', label: 'Semana 3' },
    { key: 'semana_4', label: 'Semana 4' },
  ] as const;

  weeks.forEach(week => {
    checkPageBreak(20);
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(week.label, margin, yPosition);
    yPosition += 6;
    
    const acoes = result.plano_acao_30_dias[week.key];
    acoes.forEach(acao => {
      checkPageBreak(10);
      pdf.setTextColor(99, 102, 241);
      pdf.setFontSize(10);
      pdf.text('•', margin + 2, yPosition);
      
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const acaoLines = pdf.splitTextToSize(acao, contentWidth - 8);
      acaoLines.forEach((line: string) => {
        pdf.text(line, margin + 6, yPosition);
        yPosition += 4.5;
      });
    });
    yPosition += 3;
  });

  // Benchmarks
  checkPageBreak(30);
  pdf.setFillColor(99, 102, 241, 0.1);
  pdf.rect(margin, yPosition, contentWidth, 8, 'F');
  
  pdf.setTextColor(99, 102, 241);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📊 Benchmarks e Tendências', margin + 2, yPosition + 6);
  yPosition += 12;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('O que falta no seu perfil:', margin, yPosition);
  yPosition += 6;

  result.benchmarks.o_que_falta.forEach(item => {
    checkPageBreak(10);
    pdf.setTextColor(239, 68, 68);
    pdf.setFontSize(10);
    pdf.text('•', margin + 2, yPosition);
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const itemLines = pdf.splitTextToSize(item, contentWidth - 8);
    itemLines.forEach((line: string) => {
      pdf.text(line, margin + 6, yPosition);
      yPosition += 4.5;
    });
  });

  yPosition += 3;
  checkPageBreak(15);
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Tendências para aproveitar:', margin, yPosition);
  yPosition += 6;

  result.benchmarks.tendencias.forEach(item => {
    checkPageBreak(10);
    pdf.setTextColor(99, 102, 241);
    pdf.setFontSize(10);
    pdf.text('•', margin + 2, yPosition);
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const itemLines = pdf.splitTextToSize(item, contentWidth - 8);
    itemLines.forEach((line: string) => {
      pdf.text(line, margin + 6, yPosition);
      yPosition += 4.5;
    });
  });

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Página ${i} de ${totalPages} • Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Salvar PDF
  const fileName = `analise-perfil-${platform || 'social'}-${Date.now()}.pdf`;
  pdf.save(fileName);
}
