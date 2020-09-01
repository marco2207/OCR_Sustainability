public with sharing class Sustainability_OCR_Ctrl {
    @AuraEnabled
    public static string createContentUrl(String contentDocumentId) {
        string CD_TEMP_PREFIX = 'EinsteinTemp';
        integer EXPIRY = 5;
 
        ContentVersion CV = [select id, Title from ContentVersion where ContentDocumentId =: contentDocumentId and isLatest = true];
        ContentDistribution CD = new ContentDistribution();
        CD.ContentVersionId = CV.Id;
        CD.Name = CD_TEMP_PREFIX + '_' + CV.Title;
        CD.PreferencesAllowOriginalDownload = true;
        CD.PreferencesLinkLatestVersion = true;
        CD.ExpiryDate = system.now().addMinutes(EXPIRY);
        CD.PreferencesExpires = true;
        CD.PreferencesNotifyOnVisit = false;
        CD.PreferencesNotifyRndtnComplete = false;
        insert CD;
 
        ContentDistribution CD2 = [select id, ContentDownloadUrl from ContentDistribution where Id =: cd.Id];
        return CD2.ContentDownloadUrl;
    }
    
    @AuraEnabled
    public static List <String> analyseImageUrl(String url) {
        String convertedText='';
        einsteinplay.Einstein_PredictionService service = new einsteinplay.Einstein_PredictionService(einsteinplay.Einstein_PredictionService.Types.OCR);
        einsteinplay.Einstein_PredictionResult result = service.predictOcrUrl('tabulatev2',  url, 'table', null); 
        system.debug(result);
        String KWhValue = '';
        String datePeriodValue = '';
        String dateBegin = '';
        String dateEnd = '';
        List<String> OCRInfo = new List<String>();
    
        for(Integer i=0;i<result.probabilities.size();i++)
        {

            if (result.probabilities[i].attributes.cellLocation.rowIndex == 21 && result.probabilities[i].attributes.cellLocation.colIndex == 2) {
                KWhValue = result.probabilities[i].label.substring(0,3);
                OCRInfo.add(result.probabilities[i].label.substring(0,3));
                
            }

            if (result.probabilities[i].attributes.cellLocation.rowIndex == 20 && result.probabilities[i].attributes.cellLocation.colIndex == 2) {
                datePeriodValue = result.probabilities[i].label;
                OCRInfo.add(datePeriodValue.substring(8,18));
                OCRInfo.add(datePeriodValue.substring(24,35));
            }

        }

        if (KWhValue.length() > 0) {
            //return KWhValue;
            return OCRInfo;
        } 
            
        OCRInfo.add('No recognized value, please try again or enter it manually');
        return OCRInfo;
        
    }

}
