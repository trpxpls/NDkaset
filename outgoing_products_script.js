// outgoing_products_script.js (สำหรับ outgoing_products.html)

document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('productList');
    const backToMainPageBtn = document.getElementById('backToMainPageBtn');

    let products = JSON.parse(localStorage.getItem('products')) || [];

    // เรนเดอร์สินค้าออกเมื่อหน้านี้โหลด
    renderFilteredProducts('outgoing');

    // Event Listener สำหรับปุ่มกลับหน้าหลัก
    backToMainPageBtn.addEventListener('click', () => {
        window.location.href = 'index.html'; // กลับไปหน้า index.html
    });

    // ฟังก์ชันสำหรับฟอร์แมตวันที่และเวลา
    function formatDateTime(dateString, type = 'added') {
        if (!dateString) return '';
        const options = {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false, timeZone: 'Asia/Bangkok'
        };
        const date = new Date(dateString);
        let formattedDate = date.toLocaleDateString('th-TH', options);
        if (type === 'edited') {
            return `แก้ไขล่าสุด: ${formattedDate}`;
        } else if (type === 'outgoing') {
            return `ส่งออกเมื่อ: ${formattedDate}`;
        } else if (type === 'last_incoming') {
            return `นำเข้าล่าสุด: ${formattedDate}`;
        } else {
            return `เพิ่มเมื่อ: ${formattedDate}`;
        }
    }

    // ฟังก์ชันบันทึกสินค้าลง Local Storage
    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
    }

    // Event Delegation สำหรับปุ่มในรายการสินค้า (ส่งออก, เข้า) ในหน้ารายงาน
    productList.addEventListener('click', (event) => {
        const target = event.target;
        // หา index จริงใน array products โดยใช้ timestamp เป็น data-id
        const dataId = target.dataset.id;
        if (!dataId) return;

        const productIndex = products.findIndex(p => p.timestamp === dataId); // สมมติว่า timestamp ไม่ซ้ำกัน

        if (productIndex === -1) return; // ไม่พบสินค้า

        if (target.classList.contains('dispatch-btn')) {
            const productToDispatch = products[productIndex];
            if (productToDispatch.outgoingTimestamp) {
                alert(`"${productToDispatch.name}" ถูกส่งออกไปแล้วเมื่อ: ${formatDateTime(productToDispatch.outgoingTimestamp, 'outgoing')}`);
                return;
            }
            if (confirm(`คุณต้องการทำเครื่องหมาย "${productToDispatch.name}" เป็นสินค้าส่งออกหรือไม่?`)) {
                products[productIndex].outgoingTimestamp = new Date().toISOString();
                products[productIndex].lastEdited = new Date().toISOString();
                saveProducts();
                renderFilteredProducts('outgoing'); // เรนเดอร์ใหม่
            }
        } else if (target.classList.contains('incoming-btn')) {
            const productToMarkIncoming = products[productIndex];
            if (productToMarkIncoming.outgoingTimestamp) { // ถ้าเคยถูกส่งออกไปแล้ว
                if (confirm(`คุณต้องการเปลี่ยน "${productToMarkIncoming.name}" กลับเป็นสินค้าเข้าหรือไม่?`)) {
                    products[productIndex].outgoingTimestamp = null;
                    products[productIndex].lastEdited = new Date().toISOString();
                    // อัปเดต lastIncomingTimestamp เมื่อมีการนำกลับมาเป็นสินค้าเข้า
                    products[productIndex].lastIncomingTimestamp = new Date().toISOString();
                    saveProducts();
                    renderFilteredProducts('outgoing'); // เรนเดอร์ใหม่
                }
            } else {
                alert(`"${productToMarkIncoming.name}" เป็นสินค้าเข้าอยู่แล้ว`);
            }
        }
    });

    // ฟังก์ชันเรนเดอร์สินค้าตาม filter ที่กำหนด
    function renderFilteredProducts(filterType) {
        productList.innerHTML = '';
        products = JSON.parse(localStorage.getItem('products')) || []; // โหลดข้อมูลล่าสุด

        let filteredProducts = [];
        if (filterType === 'incoming') { // ไม่น่าจะถูกเรียกใช้ในหน้านี้
            filteredProducts = products.filter(product => !product.outgoingTimestamp);
            filteredProducts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else if (filterType === 'outgoing') {
            filteredProducts = products.filter(product => product.outgoingTimestamp);
            filteredProducts.sort((a, b) => {
                if (!a.outgoingTimestamp && !b.outgoingTimestamp) return 0;
                if (!a.outgoingTimestamp) return 1;
                if (!b.outgoingTimestamp) return -1;
                return new Date(b.outgoingTimestamp) - new Date(a.outgoingTimestamp);
            });
        } else { // 'all' (ไม่น่าจะถูกเรียกใช้ในหน้านี้)
            filteredProducts = [...products];
            filteredProducts.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        if (filteredProducts.length === 0) {
            const noProductMessage = document.createElement('li');
            noProductMessage.textContent = 'ยังไม่มีสินค้าในรายการนี้';
            noProductMessage.classList.add('no-product-message');
            productList.appendChild(noProductMessage);
            return;
        }

        filteredProducts.forEach((product) => {
            const listItem = document.createElement('li');
            const productInfo = document.createElement('div');
            productInfo.classList.add('product-info');

            const productNameSpan = document.createElement('span');
            productNameSpan.classList.add('product-name');
            productNameSpan.textContent = product.name;
            productInfo.appendChild(productNameSpan);

            // เพิ่มเครื่องหมายติ๊กถูกสำหรับสินค้าเข้า
            if (!product.outgoingTimestamp) {
                const checkmarkIcon = document.createElement('span');
                checkmarkIcon.classList.add('product-status-icon');
                checkmarkIcon.innerHTML = '&#10003;';
                productInfo.appendChild(checkmarkIcon);
            }

            const productDetailSpan = document.createElement('span');
            productDetailSpan.classList.add('product-detail');
            productDetailSpan.textContent = `จำนวน: ${product.quantity} ${product.unit}`;
            productInfo.appendChild(productDetailSpan);

            // === เริ่มต้นส่วนการแสดงผลวันที่และเวลาแบบรวม ===
            const dateDetailsContainer = document.createElement('div');
            dateDetailsContainer.classList.add('product-date-details');

            const combinedTimestampSpan = document.createElement('span');
            combinedTimestampSpan.classList.add('product-combined-timestamps');

            let timestampsToDisplay = [];

            // ตรวจสอบและเพิ่มวันที่หลัก (ส่งออก / นำเข้าล่าสุด / เพิ่มเมื่อ)
            if (product.outgoingTimestamp) {
                timestampsToDisplay.push(formatDateTime(product.outgoingTimestamp, 'outgoing'));
            } else if (product.lastIncomingTimestamp && product.lastIncomingTimestamp !== product.timestamp) {
                timestampsToDisplay.push(formatDateTime(product.lastIncomingTimestamp, 'last_incoming'));
            } else {
                timestampsToDisplay.push(formatDateTime(product.timestamp, 'added'));
            }

            // เพิ่มวันที่แก้ไขล่าสุด หากแตกต่างจากวันที่หลักอื่นๆ
            if (product.lastEdited &&
                product.lastEdited !== product.timestamp &&
                product.lastEdited !== product.outgoingTimestamp &&
                product.lastEdited !== product.lastIncomingTimestamp) {
                timestampsToDisplay.push(formatDateTime(product.lastEdited, 'edited'));
            }

            combinedTimestampSpan.textContent = timestampsToDisplay.join(' | '); // รวมด้วย |

            dateDetailsContainer.appendChild(combinedTimestampSpan);
            productInfo.appendChild(dateDetailsContainer);
            // === สิ้นสุดส่วนการแสดงผลวันที่และเวลาแบบรวม ===

            listItem.appendChild(productInfo);

            const productActions = document.createElement('div');
            productActions.classList.add('product-actions');

            const incomingBtn = document.createElement('button');
            incomingBtn.classList.add('action-btn', 'incoming-btn');
            incomingBtn.dataset.id = product.timestamp;
            incomingBtn.textContent = 'เข้า';
            if (!product.outgoingTimestamp) {
                incomingBtn.disabled = true;
                incomingBtn.style.backgroundColor = '#ccc';
            } else {
                incomingBtn.style.backgroundColor = '#17a2b8';
            }
            productActions.appendChild(incomingBtn);

            const dispatchBtn = document.createElement('button');
            dispatchBtn.classList.add('action-btn', 'dispatch-btn');
            dispatchBtn.dataset.id = product.timestamp;
            dispatchBtn.textContent = 'ส่งออก';
            if (product.outgoingTimestamp) {
                dispatchBtn.disabled = true;
                dispatchBtn.style.backgroundColor = '#ccc';
            }
            productActions.appendChild(dispatchBtn);

            // ลบปุ่มแก้ไขและลบออก (คงไว้ตามที่ได้แก้ไขไปก่อนหน้านี้)
            // const editBtn = document.createElement('button');
            // editBtn.classList.add('action-btn', 'edit-btn');
            // editBtn.dataset.id = product.timestamp;
            // editBtn.textContent = 'แก้ไข';
            // productActions.appendChild(editBtn);

            // const deleteBtn = document.createElement('button');
            // deleteBtn.classList.add('action-btn', 'delete-btn');
            // deleteBtn.dataset.id = product.timestamp;
            // deleteBtn.textContent = 'ลบ';
            // productActions.appendChild(deleteBtn);

            listItem.appendChild(productActions);
            productList.appendChild(listItem);
        });
    }
});