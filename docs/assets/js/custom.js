function toggleEye(){
    if($('#eyeBall i').hasClass('mdi-eye')){
        $('#eyeBall i').removeClass('mdi-eye')
        $('#eyeBall i').addClass('mdi-eye-off')
        $('#password').attr('type', 'text')
    }
    else{
         $('#eyeBall i').removeClass('mdi-eye-off')
        $('#eyeBall i').addClass('mdi-eye')
        $('#password').attr('type', 'password')
    }
}

function createWallet(){
    if($('#password').val().length<9){
        toastMsg('Error', "Your password must be at least 9 characters long.<br>Please try again", "danger");
        return;
    }
    toastMsg('Almost There', "You are ready to download your keystore file and receive your private key", "success");
       
    $('.createWallet').hide();
    $('.saveKeystore').show();
}


function downloadKeystore(){
    var userWallet = generateAddress($('#password').val())
    localStorage.setItem('lastAddress', userWallet.address)
    localStorage.setItem('lastKey', userWallet.privKey)
    $('#newPrivKey').val(userWallet.privKey)
    $('.iUnderstandButton').attr('disabled', false)
}

function printPaperWallet(){
     var win = window.open("about:blank", "_blank");
    var data = '<html><h2>Paper Wallet</h2><br><h5>Bitcoin Address</h5><br><div id="qrcode"></div><br><div id="address"></div><br><hr><br><h5>Private Key</h5><br><div id="qrcode1"></div><br><div id="privKey"></div><br><script src="assets/js/qrcode.js"></script><script>new QRCode(document.getElementById("qrcode"), localStorage.getItem("lastAddress"));new QRCode(document.getElementById("qrcode1"), localStorage.getItem("lastKey"));document.getElementById("address").innerHTML=localStorage.getItem("lastAddress"); document.getElementById("privKey").innerHTML=localStorage.getItem("lastKey");</script></html>'
    win.document.write(data);

}

function clearPreviousData(){
    localStorage.setItem('lastAddress', '')
    localStorage.setItem('lastKey', '')
}

function iUnderstand(){
     $('.createWallet').hide();
    $('.saveKeystore').hide();
     $('.privateSection').show();
}

function restart(){
     $('.createWallet').show();
    $('.saveKeystore').hide();
     $('.privateSection').hide();
     $('#password').val('');
    localStorage.setItem('lastAddress', '')
    localStorage.setItem('lastKey', '')

}


function encryptScreen(){
    $('.createSection').hide();
    $('.sendSection').hide();
    $('.encryptSection').show();
    $('.page-title').html('Encrypt Existing Key')
    $('.breadcrumb-item:nth(1)').html('Encrypt Existing')
    $('#privKeyArea').show()
    $('#passCodeArea').hide()
    $('#addPassButton').show();
     $('#encryptProgress').hide()
      $('#encryptedText').hide()
      restart()

}

function sendScreen(){
    $('.createSection').hide();
    $('.encryptSection').hide();
    $('.sendSection').show();
    $('.page-title').html('Send Bitcoin')
    $('.breadcrumb-item:nth(1)').html('Send Bitcoin')

     $('.howAccess').show()
     $('.generateTransaction').hide()
     restart()

}



function createScreen(){
    $('.createSection').show();
    $('.encryptSection').hide();
    $('.sendSection').hide();
    $('.page-title').html('Create New Bitcoin Address')
    $('.breadcrumb-item:nth(1)').html('Create Address')
    restart()
}


function fileUploadListen(){

    $('#walletFileButton').on('change', function(){
        selectedFile = document.getElementById('walletFileButton').files[0]
        var reader = new FileReader()
        reader.onload = function(event){ validateUpload(event.target.result);}
        reader.onerror = function(event){}
        reader.readAsText(selectedFile)
       

    })
}


function validateUpload(fileContent){
    try{
    var encKey= $.parseJSON(fileContent)

    cypherText = encKey.Crypto.cyphertext;

    $('#unlockCode').show();
    $('#unlockButton').show()

    return true;
    }
    catch(err){
        toastMsg("Incorrect Format", "Please upload an encrypted JSON file that is the correct format", "danger")
        return false;
    }
}

function unlockMethodListen(){
    $('.howAccess input[type=radio]').on('click', function(){
        $('.credentials').show()
        if($(this).val() == "private"){
            $('.accessAction').html("Paste Your Private Key")
            $('.accessInstruct').html('This is not a recommended way to access your wallet.<br><br>Entering your private key on a website is dangerous. If our website is compromised or you accidentally visit a different website, your funds will be stolen.')
            $('#privKey').show()
            $('#walletFileButton').hide()
            $('#privKeyButton').show()
            $('#unlockCode').hide();
            $('#unlockButton').hide()
        }
        else{
             $('.accessAction').html("Select Your Wallet File")
             $('.accessInstruct').html('Entering your private key on a website dangerous. If you accidentally visit a website other than CreateSendBitcoin.com (less you are running this open-source code locally), your funds will be stolen.')
            $('#privKey').hide()
            $('#walletFileButton').show()
            $('#privKeyButton').hide()
            $('#unlockCode').hide();
            $('#unlockButton').hide()
        }
    })
}

function unlockEncrypted(){

    var decryptResult = decryptWallet(cypherText, $('#unlockCode').val());

    if(decryptResult == false){

        toastMsg("Error", "Your passphrase does not unlock this", "danger")
        return;
    }
    else{
        userAddress = privKeyToAddress(decryptResult);
        currentPriv = decryptResult;
        toastMsg("Success", "You have unlocked this wallet", "success")
        getWalletInfo(userAddress);
    }

    $('.howAccess').hide()
    $('.generateTransaction').show()
     $('#transactions').hide();
}

function getWalletInfo(userAddress){
    $('#userAddress').html(userAddress)

    $.ajax({
        url:'https://avocado.proofsuite.com/cloud/api/beta/blockchain.php?address='+userAddress,
        complete:function(transport){
            walletData = $.parseJSON(transport.responseText);
            $('#userBalance').html((walletData.final_balance / 100000000).toFixed(4) + " BTC");

            $('#transHistory').html('<a href="https://www.blockchain.com/btc/address/'+userAddress+'" style="max-width:50px; overflow:scroll; word-wrap:break-word; color:white" target="_blank">https://www.blockchain.com/btc/address/'+userAddress+'</a>')
        }
    })
}


function broadcastTransaction(hash){
    $('#sendTransProgress').show()
$('#sendTransactionButton').attr('disabled', true);
    $.ajax({
        'url':'https://avocado.proofsuite.com/cloud/api/beta/broadcast.php',
        data: {transHash:hash},
        complete:function(transport){

            try{
                    txHash = $.parseJSON(transport.responseText);
                $('#successTrans').show().html('Transaction ID: <a href="https://www.blockchain.com/btc/tx/'+txHash.txid+'" target="_blank">https://www.blockchain.com/btc/tx/'+txHash.txid+'</a>')

                 $('#sendTransactionButton').attr('disabled', false);
                     $('#sendTransProgress').hide()
            }

            catch(err){
                toastMsg("Error", "There was an issue submitting your transaction to the blockchain. Please try again later. Or broadcast this transaction has on Coinb.in. ", "danger")

                 $('#sendTransactionButton').attr('disabled', false);
                     $('#sendTransProgress').hide()
                return;
            }
           
            toastMsg("Success", "Your transaction has been submitted to the blockchain", "success");


         


        }

    })
}
function unlockPrivate(){
     var isValidKey= privKeyToAddress($('#privKey').val().trim());
     currentPriv = $('#privKey').val().trim();
    if(isValidKey == false){

        toastMsg("Error", "This is not a valid private key", "danger")
        return;
    }
    else{
       userAddress = isValidKey;
        toastMsg("Success", "You have unlocked this wallet", "success")
        getWalletInfo(userAddress);
    }

    $('.howAccess').hide()
    $('.generateTransaction').show()
     $('#transactions').hide();
}


function sendTransaction(){
    $('#sendTransactionButton').attr('disabled', true);

    var signedHash = $('#signedTrans').val();
    if($('#toAddress').val().trim().length < 33){
        toastMsg("Error", "Invalid Recepient Address", 'danger');
        return;
    }

    if(isNaN($('#amountToSend').val().trim())){
          toastMsg("Error", "Amount you are sending is not a number", 'danger');
        return;
    }

    if(isNaN($('#feePer100').val().trim())){
          toastMsg("Error", "Your fee is not a number. Please send a valid number", 'danger');
        return;
    }

    broadcastTransaction(signedHash.trim());

}

function generateTransaction(){



    if($('#toAddress').val().trim().length < 33){
        toastMsg("Error", "Invalid Recepient Address", 'danger');
        return;
    }

    if(isNaN($('#amountToSend').val().trim()) || $('#amountToSend').val().trim() == ""){
          toastMsg("Error", "Amount you are sending is not a number", 'danger');
        return;
    }

    if(isNaN($('#feePer100').val().trim()) || $('#feePer100').val().trim() ==""){
          toastMsg("Error", "Your fee is not a number. Please send a valid number", 'danger');
        return;
    }

    $('#transactions').show();
      generateAndSignTransaction(userAddress, currentPriv, $('#toAddress').val(), parseFloat($('#amountToSend').val()), walletData, parseFloat($('#feePer100').val()) );

         

     $('#signedTrans').val(response[1])
     $('#rawTrans').val(response[0])

}

function addPasscode(){
    if($('#toEncryptPriv').val().length < 40){
        toastMsg('Not Valid', "The private key you entered is not a valid Bitcoin key", 'danger');
        return;
    }
   
    isValidAddress = privKeyToAddress( $('#toEncryptPriv').val().trim())

    if(isValidAddress == false){
         toastMsg('Not Valid', "The private key you entered is not a valid Bitcoin key that converts into bitcoin address", 'danger');
        return;
    }




    $('#passCodeArea').show()
    $('#addPassButton').hide();
}

function encryptPriv(){

    var textToShow = generateEncryptedFromKey($('#toEncryptPriv').val().trim(), privKeyToAddress($('#toEncryptPriv').val().trim()),$('#toEncryptPass').val().trim())

$('.encText').val(textToShow);


    $('.encProgress').css({'width':'40%'})
    $('#encryptProgress').show()
    setTimeout(function(){
        $('.encProgress').css({'width':'75%'})
    }, 1000)
    setTimeout(function(){
        $('#encryptProgress').hide()
        $('#encryptedText').show()
        $('.encProgress').css({'width':'10%'})
        $('#privKeyArea').hide()
        $('#passCodeArea').hide()
    },2000)
}




function setupNotification(){

    NotificationApp = function() {
    };


    /**
     * Send Notification
     * @param {*} heading heading text
     * @param {*} body body text
     * @param {*} position position e.g top-right, top-left, bottom-left, etc
     * @param {*} loaderBgColor loader background color
     * @param {*} icon icon which needs to be displayed
     * @param {*} hideAfter automatically hide after seconds
     * @param {*} stack 
     */
    NotificationApp.prototype.send = function(heading, body, position, loaderBgColor, icon, hideAfter, stack, showHideTransition) {
        // default      
        if (!hideAfter)
            hideAfter = 5000;
        if (!stack)
            stack = 1;

        var options = {
            heading: heading,
            text: body,
            position: position,
            loaderBg: loaderBgColor,
            icon: icon,
            hideAfter: hideAfter,
            stack: stack
        };

        if(showHideTransition)
            options.showHideTransition = showHideTransition;

       // console.log(options);
        $.toast().reset('all');
        $.toast(options);
    },

    $.NotificationApp = new NotificationApp, $.NotificationApp.Constructor = NotificationApp

  

}


function toastMsg(title, msg, msgType="success"){

  if(typeof title !="string"){
    title= "hello"
  }
   if(typeof msg !="string"){
   msg= "example message"
  }
  if(msgType== "success"){
   $.NotificationApp.send(title, msg, 'top-right', '#5ba035', 'success');
  }

  else if(msgType =="info"){
     $.NotificationApp.send(title, msg, 'bottom-right', '#3b98b5', 'info');
  }
  else if(msgType=="warning"){
     $.NotificationApp.send(title, msg, 'top-center', '#da8609', 'warning');
  }
  else{
       $.NotificationApp.send(title, msg, 'top-right', '#bf441d', 'error');
  }

}


function downloadEncryptedFile(){
    download(fileName, fileText);
}

$(document).ready(function(){
    unlockMethodListen()
    fileUploadListen()
    setupNotification()
    clearPreviousData();
})