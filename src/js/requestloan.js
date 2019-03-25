App = {

    web3Provider: null,
    contracts: {},

    init: () => {
        console.log("App.init()");
        return App.initWeb3();
    },

    initWeb3: () => {
        if (typeof web3 !== 'undefined') { // check if injected web3 provider such as metamask
            App.web3Provider = web3.currentProvider;
            console.log("found existing web3 provider");
        } else {
            App.web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
            console.log("connecting to local Ganache");
        }
        web3 = new Web3(App.web3Provider);
        console.log("initialized web3 instance");
        return App.initContract();
    },

    initContract: () => {

        $.getJSON("LoanRequestPlatform.json", (data) => {
            // This creates an instance of the contract we can interact with.
            App.contracts.loanRequestPlatform = TruffleContract(data);
            // Set the provider for our contract
            App.contracts.loanRequestPlatform.setProvider(App.web3Provider);
            console.log("initialized loan request platform contract");

            return App.initUI();
        });
    },


    initUI: async () => {

        return App.bindEvents();
    },


    bindEvents: () => {

        $('#loansubmit').click(e => {
            App.loanSubmit();
        })
    },

    // 1000000000000000000 WEI
    loanSubmit: async () => {

        console.log("loan request pending");

        $("#spinner").css('visibility', 'visible');
        $("#loansubmit").text("Loading");

        const acct = (await web3.eth.getAccounts())[0];
        console.log(acct);

        const loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();

        const reasontext = $('#reason').val();
        const repaymentplantext = $('#repaymentplan').val();
        const amountReq = $('#amountrequested').val(); // a huge string number in wei. pass directly to our contract itll take care of it
        const phonenum = $('#phonenumber').val();

        console.log("%s %s %s %s", reasontext, repaymentplantext, amountReq, phonenum);


        try {
            // get an estimate of the gas to use
            const gas = await loanRequestPlatformInstance.requestLoan.estimateGas(reasontext, repaymentplantext, amountReq, phonenum, {from: acct});
            // perform transaction using the gas estimate
            const tx = await loanRequestPlatformInstance.requestLoan(reasontext, repaymentplantext, amountReq, phonenum, {
                from: acct,
                gas: gas
            });

            console.log(tx);
            console.log("loan request success");
        } catch (err) {
            console.log(err);
        }

        // $('#personaldashbutton').click();
    }


};

$(window).on("load", function () {

    App.init();

});

