const state={products:[],categories:[],journal:[],faq:[],filter:"All",search:"",cart:JSON.parse(localStorage.getItem("nexora-cart")||"[]")};

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);

async function loadData(){
  const [p,c,j,f]=await Promise.all([
    fetch("data/products.json").then(r=>r.json()),
    fetch("data/categories.json").then(r=>r.json()),
    fetch("data/journal.json").then(r=>r.json()),
    fetch("data/faq.json").then(r=>r.json())
  ]);
  state.products=p;state.categories=c;state.journal=j;state.faq=f;
  renderCategories();renderFilters();renderProducts();renderJournal();renderFaq();renderCart();
}
function renderCategories(){
  $("#categoryGrid").innerHTML=state.categories.map(c=>`<article class="categoryCard" data-cat="${c.name}"><img src="${c.image}" alt="${c.name}"><div class="catText"><h3>${c.name}</h3><p>${c.text}</p><small>${c.count} products →</small></div></article>`).join("");
  $$(".categoryCard").forEach(x=>x.onclick=()=>setFilter(x.dataset.cat));
}
function renderFilters(){
  const cats=["All",...state.categories.map(c=>c.name)];
  $("#filters").innerHTML=cats.map(c=>`<button class="filter ${state.filter===c?"active":""}" data-filter="${c}">${c}</button>`).join("");
  $$(".filter").forEach(b=>b.onclick=()=>setFilter(b.dataset.filter));
}
function visibleProducts(){
  return state.products.filter(p=>{
    const okCat=state.filter==="All"||p.category===state.filter;
    const hay=`${p.name} ${p.category} ${p.short} ${p.description}`.toLowerCase();
    return okCat && (!state.search||hay.includes(state.search.toLowerCase()));
  });
}
function renderProducts(){
  const items=visibleProducts();
  $("#productGrid").innerHTML=items.length?items.map(p=>`
  <article class="product">
    <div class="productMedia" data-view="${p.id}"><img src="${p.image}" alt="${p.name}" loading="lazy"><span class="badge">${p.badge}</span></div>
    <div class="productBody"><span class="cat">${p.category}</span><h3>${p.name}</h3><div class="rating">★★★★★ <span>${p.rating} · ${p.reviews} reviews</span></div><p>${p.short}</p>
    <div class="priceRow"><div><span class="price">${money(p.price)}</span><span class="old">${money(p.oldPrice)}</span></div><button class="add" data-add="${p.id}">Add</button></div></div>
  </article>`).join(""):`<div style="grid-column:1/-1;padding:50px;text-align:center">No products match your search.</div>`;
  $$("[data-view]").forEach(el=>el.onclick=()=>openProduct(el.dataset.view));
  $$("[data-add]").forEach(el=>el.onclick=e=>{e.stopPropagation();addToCart(el.dataset.add)});
}
function setFilter(f){state.filter=f;state.search="";$("#search").value="";renderFilters();renderProducts();document.querySelector("#products").scrollIntoView({behavior:"smooth",block:"start"})}
function openProduct(id){
  const p=state.products.find(x=>x.id===id); if(!p)return;
  $("#modalContent").innerHTML=`<div class="modalContent"><img class="modalImg" src="${p.image}" alt="${p.name}"><div class="modalInfo"><span class="eyebrow dark">${p.category}</span><h2>${p.name}</h2><div class="rating">★★★★★ ${p.rating} · ${p.reviews} reviews</div><p>${p.description}</p><ul class="specs">${p.specs.map(s=>`<li>${s}</li>`).join("")}</ul><div style="font-size:28px;font-weight:800;margin:24px 0">${money(p.price)} <span class="old">${money(p.oldPrice)}</span></div><button class="primary" style="width:100%" data-modal-add="${p.id}">Add to Bag →</button></div></div>`;
  $("#modal").classList.add("open");$("[data-modal-add]").onclick=()=>{addToCart(id);$("#modal").classList.remove("open")};
}
function addToCart(id){const p=state.products.find(x=>x.id===id);const row=state.cart.find(x=>x.id===id);if(row)row.qty++;else state.cart.push({id,qty:1});persist();renderCart();toast(`${p.name} added to your bag.`)}
function changeQty(id,delta){const row=state.cart.find(x=>x.id===id);if(!row)return;row.qty+=delta;if(row.qty<=0)state.cart=state.cart.filter(x=>x.id!==id);persist();renderCart()}
function persist(){localStorage.setItem("nexora-cart",JSON.stringify(state.cart))}
function renderCart(){
  const count=state.cart.reduce((a,x)=>a+x.qty,0);$("#cartCount").textContent=count;
  const items=state.cart.map(x=>{const p=state.products.find(y=>y.id===x.id);return p?`<div class="cartItem"><img src="${p.image}" alt="${p.name}"><div><h4>${p.name}</h4><p>${money(p.price)} each</p><div class="qty"><button data-q="${p.id}" data-d="-1">−</button><b>${x.qty}</b><button data-q="${p.id}" data-d="1">+</button></div></div><strong>${money(p.price*x.qty)}</strong></div>`:""}).join("");
  $("#cartItems").innerHTML=items||`<p style="color:#667887;padding:30px 0">Your bag is empty. Explore the catalog and add something you like.</p>`;
  const total=state.cart.reduce((a,x)=>{const p=state.products.find(y=>y.id===x.id);return a+(p?p.price*x.qty:0)},0);$("#cartTotal").textContent=money(total);
  $$("[data-q]").forEach(b=>b.onclick=()=>changeQty(b.dataset.q,+b.dataset.d));
}
function renderJournal(){ $("#journalGrid").innerHTML=state.journal.map(j=>`<article class="journalCard"><span class="tag">${j.tag}</span><h3>${j.title}</h3><p>${j.text}</p><time>${j.date}</time></article>`).join("") }
function renderFaq(){ $("#faqList").innerHTML=state.faq.map((f,i)=>`<div class="faqItem"><button class="faqQ">${f.q}<span>+</span></button><div class="faqA">${f.a}</div></div>`).join(""); $$(".faqQ").forEach(b=>b.onclick=()=>b.parentElement.classList.toggle("open"))}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}
function scrollToSel(sel){const el=document.querySelector(sel);if(el)el.scrollIntoView({behavior:"smooth",block:"start"})}

document.addEventListener("click",e=>{
  const cat=e.target.closest("[data-category]");if(cat){e.preventDefault();setFilter(cat.dataset.category);return}
  const sc=e.target.closest("[data-scroll]");if(sc){e.preventDefault();scrollToSel(sc.dataset.scroll)}
});
$("#cartBtn").onclick=()=>$("#drawer").classList.add("open");$("#closeCart").onclick=()=>$("#drawer").classList.remove("open");$("#drawer").onclick=e=>{if(e.target===e.currentTarget)e.currentTarget.classList.remove("open")};
$("#closeModal").onclick=()=>$("#modal").classList.remove("open");$("#modal").onclick=e=>{if(e.target===e.currentTarget)e.currentTarget.classList.remove("open")};
$("#search").addEventListener("input",e=>{state.search=e.target.value;state.filter="All";renderFilters();renderProducts()});
$("#searchBtn").onclick=()=>scrollToSel("#products");
$("#newsletterForm").onsubmit=e=>{e.preventDefault();$("#newsletterMsg").textContent="Thanks — you’re on the NEXORA list.";e.target.reset()};
$("#checkout").onclick=()=>{
  if(!state.cart.length){toast("Your bag is empty.");return}
  const lines=state.cart.map(x=>{const p=state.products.find(y=>y.id===x.id);return `${x.qty} × ${p.name} — ${money(p.price*x.qty)}`}).join("%0D%0A");
  const total=state.cart.reduce((a,x)=>{const p=state.products.find(y=>y.id===x.id);return a+p.price*x.qty},0);
  location.href=`mailto:support@nexora-tech.com?subject=NEXORA%20Order%20Request&body=Hello%20NEXORA%20Support,%0D%0A%0D%0AI'd%20like%20to%20request%20an%20order:%0D%0A%0D%0A${lines}%0D%0A%0D%0ASubtotal:%20${money(total)}`;
};
loadData().catch(err=>{console.error(err);$("#productGrid").innerHTML="<p>Store data could not be loaded. Check that the ZIP contents were uploaded to the repository root.</p>"});
