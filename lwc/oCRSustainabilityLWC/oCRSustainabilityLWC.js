import { LightningElement,api,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import { updateRecord } from 'lightning/uiRecordApi';
import createContentUrl from '@salesforce/apex/Sustainability_OCR_Ctrl.createContentUrl';
import analyseImageUrl from '@salesforce/apex/Sustainability_OCR_Ctrl.analyseImageUrl';
import LOCALE from '@salesforce/i18n/locale';

export default class OCRSustainabilityLWC extends LightningElement {
    @track contentId;
    @track error;
    @track pictureSrc="https://s3-us-west-1.amazonaws.com/sfdc-demo/image-placeholder.png";
    @api recordId;
    @api isUpdateRecord;
    @api fieldAPIName;
    @api fieldAPINameSD;
    @api fieldAPINameED;   
    @api convertedText;
    
    get acceptedFormats() {
        return ['.jpg','.png','.jpeg'];
    }

    handleUploadFinished(event) {
        let uploadedFiles = event.detail.files;
        // eslint-disable-next-line no-console
        console.log("@@@ upload finished " + uploadedFiles.length);
        
        
        for(let i=0; i<uploadedFiles.length; i++) {
           // eslint-disable-next-line no-console
           console.log( uploadedFiles[i].name + ' - ' + uploadedFiles[i].documentId );
           this.contentId =  uploadedFiles[i].documentId;
            // eslint-disable-next-line no-console
       // console.log("content id -----  " +  this.contentId);
        }
        this.getContentUrl();
        console.log("@@@ content url got");

        this.text="Thank you!";
    }
    getContentUrl()
    {
        console.log("@@@ calling content method to get content url");
        createContentUrl(
            {
                contentDocumentId:this.contentId
            }
        )
        .then(result => {
            console.log("@@@ result----"+result);
            console.log("image url -----"+result);
            this.pictureSrc = result;
            this.analyzeImage(result);

        })
        .catch(error => {
            console.log("@@@ error creating content url");
            this.error = error;
        });

    }
    analyzeImage(picUrl)
    {
        console.log("@@@ calling Analyze image");

        analyseImageUrl(
            {
                url: picUrl

            }
        )
        .then(result => {
           // console.log(result.data.probabilities);
            let conts=result[2];
            console.log("@@@ result from Analyze image");
            console.log(result);

            this.convertedText=result[2];
            console.log('@@@ first value of result: ' + result[0]);
            console.log('@@@ second value of result: ' + result[1]);
            console.log('@@@ third value of result: ' + result[2]);
            var startDateNF = result[0].split('/');
            var endDateNF = result[1].split('/');
            
            // Please pay attention to the month (parts[1]); JavaScript counts months from 0:
            // January - 0, February - 1, etc.
            // The Date time has been set to 10 AM to avoid the toISOString bring back date 1 day,
            // I suspect the daylight saving time and midnight if set with time to o 
        
            let SD = new Date(startDateNF[2], startDateNF[0] - 1, startDateNF[1], 10, 0, 0, 0);
            let usableSD = SD.toISOString();
            // debug stuff for Date issue
            console.log('@@@ my SD: ' + SD);
            console.log('@@@ my usableSD: ' + usableSD);

            let ED = new Date(endDateNF[2], endDateNF[0] - 1, endDateNF[1], 10, 0, 0, 0);
            let usableED = ED.toISOString();
            // debug stuff for Date issue
            console.log('@@@ my ED: ' + ED);
            console.log('@@@ my usableED: ' + usableED);

            if(this.isUpdateRecord==true)
            {
            const fields = {};
            fields['Id'] = this.recordId;
            fields[this.fieldAPIName] = this.convertedText;
            fields[this.fieldAPINameSD] = usableSD;
            fields[this.fieldAPINameED] = usableED;
           
            const recordInput = { fields };
            updateRecord(recordInput)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Successfully Updated!',
                        variant: 'success'
                    })
                );
                // Display fresh data in the form
                return refreshApex(this.contact);
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
        }
        })
        .catch(error => {
            console.log("@@@ error in analyze image ....");

            this.error = error;
        });
    }
}
