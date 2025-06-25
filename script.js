function downloadPDF(){
const element= document.querySelector('.container-lg');
const opt={
    margin: 0,
    filename: 'CV_Laura_Alexandra_Ospina_Osorio.pdf',
    image: { type: 'jpeg', quality:0.98},
    html2canvas: {scale:2, useCors:true, scrolly:0},
    jsPDF: {unit: 'mm', format:'letter', orientation:'portrait'}, /* in=pulgadas */
    pagebreak: {mode: ['css', 'legacy']}
};
    html2pdf().set(opt).from(element).save();
}