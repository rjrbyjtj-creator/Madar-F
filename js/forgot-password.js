/* MADAR — password recovery UI
 * API contract (implemented in the backend phase):
 * POST forgotPassword:       { identifier, channel }
 * POST forgotPasswordVerify: { identifier, channel, code }
 * POST resetPassword:        { identifier, channel, code, newPassword, resetToken }
 * verify response must include a short-lived session token for the optional "Later / sign in" action.
 */
(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const panel = $('#forgotForm');
  const card = $('#box');
  if (!panel || !card) return;
  const identifier = $('#forgotIdentifier');
  const channelBox = $('#forgotChannel');
  const digits = $$('#forgotOtp input');
  let resetToken = '';
  let sessionToken = '';
  let verifiedUser = null;
  let busy = false;

  const fa = value => String(value).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const setMessage = (step, message, error=false) => {
    const el = $('#forgotMsg'+step);
    if (!el) return;
    el.textContent = message;
    el.style.color = error ? 'var(--bad)' : 'var(--blue)';
  };
  const setStep = n => {
    panel.dataset.step = String(n);
    if (n === 2) setTimeout(() => digits[0].focus(), 120);
    if (n === 3) setTimeout(() => $('#forgotPassword').focus(), 120);
  };
  const showLogin = () => {
    card.dataset.m = 'login';
    const tab = $('[data-go="login"]');
    if (tab) tab.click();
    panel.reset();
    panel.dataset.step = '1';
    digits.forEach(x => x.value='');
    resetToken=''; sessionToken=''; verifiedUser=null;
    setMessage(1,''); setMessage(2,''); setMessage(3,'');
  };
  const destination = user => user && user.role === 'admin' && API.adminDashboard ? API.adminDashboard : API.dashboard;
  const enterAccount = () => {
    if (!sessionToken) {
      setMessage(3,'تأیید انجام شده اما توکن ورود از سرور دریافت نشد. این مورد پس از راه‌اندازی بک‌اند تکمیل می‌شود.',true);
      return;
    }
    Auth.save(sessionToken,true);
    location.href = destination(verifiedUser);
  };
  const post = async (url, body) => {
    if (!url) throw new Error('مسیر سرویس هنوز در فرانت‌اند تنظیم نشده است.');
    const response = await fetch(url,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    let data={}; try { data=await response.json(); } catch {}
    if (!response.ok) {
      const error=new Error(data.message || data.error || 'درخواست انجام نشد.');
      error.status=response.status;
      throw error;
    }
    return data;
  };
  const setBusy = (button, value) => {
    busy=value;
    button.disabled=value;
    button.classList.toggle('load',value);
  };
  const currentChannel = () => channelBox.dataset.channel || 'email';
  const requestData = () => ({identifier:fa(identifier.value.trim()),channel:currentChannel()});

  $('#forgotLink').addEventListener('click', event => {
    event.preventDefault();
    card.dataset.m='forgot';
    panel.dataset.step='1';
    document.title='بازیابی رمز عبور | مدار';
    identifier.focus();
  });
  $('#forgotBack').addEventListener('click',showLogin);
  $$('[data-forgot-later]').forEach(button => button.addEventListener('click',showLogin));
  channelBox.addEventListener('click', event => {
    const button=event.target.closest('[data-channel]');
    if(!button)return;
    channelBox.dataset.channel=button.dataset.channel;
    $$('button',channelBox).forEach(item=>item.classList.toggle('on',item===button));
  });
  $$('[data-toggle-password]').forEach(button => button.addEventListener('click',()=>{
    const input=$('#'+button.dataset.togglePassword);
    input.type=input.type==='password'?'text':'password';
  }));

  panel.addEventListener('input',event=>{
    const field=event.target.closest('.f');
    if(field)field.classList.remove('bad');
  });
  $('#forgotSend').addEventListener('click',async event=>{
    event.preventDefault();
    const value=identifier.value.trim();
    if(!value){identifier.closest('.f').classList.add('bad');identifier.focus();return;}
    const button=event.currentTarget;
    if(busy)return;
    setBusy(button,true);setMessage(1,'در حال ارسال کد…');
    try{
      const result=await post(API.forgotPassword,requestData());
      $('#forgotDestination').textContent=result.destination || value;
      digits.forEach(input=>input.value='');
      setMessage(1,'');
      setStep(2);
    }catch(error){setMessage(1,error.message || 'ارسال کد انجام نشد.',true);}
    finally{setBusy(button,false);}
  });

  const verifyCode=async()=>{
    const code=digits.map(input=>fa(input.value)).join('');
    if(code.length!==6){setMessage(2,'کد شش‌رقمی را کامل وارد کن.',true);return;}
    const button=$('#forgotVerify');
    if(busy)return;
    setBusy(button,true);setMessage(2,'در حال بررسی کد…');
    try{
      const result=await post(API.forgotPasswordVerify,{...requestData(),code});
      resetToken=result.resetToken || result.reset_token || '';
      sessionToken=result.token || result.accessToken || '';
      verifiedUser=result.user || null;
      if(!resetToken && !sessionToken) throw new Error('سرور کد را پذیرفت اما مجوز ادامهٔ بازیابی را برنگرداند.');
      if(sessionToken) Auth.save(sessionToken,true);
      setMessage(2,'');
      setStep(3);
    }catch(error){setMessage(2,error.message || 'کد اشتباه است یا منقضی شده.',true);}
    finally{setBusy(button,false);}
  };
  $('#forgotVerify').addEventListener('click',verifyCode);
  digits.forEach((input,index)=>{
    input.addEventListener('input',()=>{
      input.value=fa(input.value).replace(/\D/g,'').slice(-1);
      if(input.value && index<5)digits[index+1].focus();
      if(digits.every(item=>item.value))verifyCode();
    });
    input.addEventListener('keydown',event=>{
      if(event.key==='Backspace' && !input.value && index>0)digits[index-1].focus();
      if(event.key==='ArrowLeft' && index<5)digits[index+1].focus();
      if(event.key==='ArrowRight' && index>0)digits[index-1].focus();
    });
    input.addEventListener('paste',event=>{
      const value=fa(event.clipboardData.getData('text')).replace(/\D/g,'').slice(0,6);
      if(!value)return;
      event.preventDefault();
      [...value].forEach((digit,i)=>{if(digits[i])digits[i].value=digit;});
      if(value.length===6)verifyCode(); else digits[Math.min(value.length,5)].focus();
    });
  });
  $('#forgotEdit').addEventListener('click',()=>setStep(1));
  $('#forgotResend').addEventListener('click',async()=>{
    if(busy)return;
    setMessage(2,'در حال ارسال دوباره کد…');
    try{await post(API.forgotPassword,requestData());setMessage(2,'کد جدید ارسال شد.');}
    catch(error){setMessage(2,error.message || 'ارسال دوباره انجام نشد.',true);}
  });

  $('#forgotReset').addEventListener('click',async event=>{
    const password=$('#forgotPassword').value;
    const confirm=$('#forgotPassword2').value;
    if(password.length<6){$('#forgotPassword').closest('.f').classList.add('bad');return;}
    if(password!==confirm){$('#forgotPassword2').closest('.f').classList.add('bad');setMessage(3,'دو رمز عبور یکسان نیستند.',true);return;}
    const button=event.currentTarget;
    if(busy)return;
    setBusy(button,true);setMessage(3,'در حال ذخیره رمز جدید…');
    try{
      const result=await post(API.resetPassword,{...requestData(),code:digits.map(x=>fa(x.value)).join(''),newPassword:password,resetToken});
      sessionToken=result.token || result.accessToken || sessionToken;
      verifiedUser=result.user || verifiedUser;
      if(!sessionToken)throw new Error('رمز تغییر کرد اما توکن ورود دریافت نشد؛ لطفاً با رمز جدید وارد شو.');
      Auth.save(sessionToken,true);
      setMessage(3,'رمز عبور با موفقیت تغییر کرد. در حال ورود…');
      setTimeout(()=>location.href=destination(verifiedUser),500);
    }catch(error){setMessage(3,error.message || 'تغییر رمز انجام نشد.',true);}
    finally{setBusy(button,false);}
  });
  $('#forgotSkip').addEventListener('click',enterAccount);
  panel.addEventListener('submit',event=>event.preventDefault());
})();
