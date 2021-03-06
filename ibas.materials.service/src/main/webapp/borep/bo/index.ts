﻿/**
 * @license
 * Copyright color-coding studio. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0
 * that can be found in the LICENSE file at http://www.apache.org/licenses/LICENSE-2.0
 */

// 模块索引文件，此文件集中导出类
export * from "../../api/Datas";
export * from "./GoodsIssue";
export * from "./GoodsReceipt";
export * from "./InventoryTransfer";
export * from "./Material";
export * from "./MaterialGroup";
export * from "./MaterialInventory";
export * from "./MaterialInventoryJournal";
export * from "./Warehouse";
export * from "./Product";
export * from "./MaterialBatch";
export * from "./MaterialSerial";
export * from "./MaterialPriceList";
export * from "./MaterialBatchJournal";
export * from "./MaterialSerialJournal";

// 注册业务对象到工厂
import * as ibas from "ibas/index";
import { GoodsIssue } from "./GoodsIssue";
ibas.boFactory.register(GoodsIssue.BUSINESS_OBJECT_CODE, GoodsIssue);
import { GoodsReceipt } from "./GoodsReceipt";
ibas.boFactory.register(GoodsReceipt.BUSINESS_OBJECT_CODE, GoodsReceipt);
import { InventoryTransfer } from "./InventoryTransfer";
ibas.boFactory.register(InventoryTransfer.BUSINESS_OBJECT_CODE, InventoryTransfer);
import { Material, MaterialPrice, MaterialQuantity } from "./Material";
ibas.boFactory.register(Material.BUSINESS_OBJECT_CODE, Material);
// 模块内应用对象
ibas.boFactory.register(MaterialPrice);
ibas.boFactory.register(MaterialQuantity);
import { Product } from "./Product";
ibas.boFactory.register(Product.BUSINESS_OBJECT_CODE, Product);
import { MaterialGroup } from "./MaterialGroup";
ibas.boFactory.register(MaterialGroup.BUSINESS_OBJECT_CODE, MaterialGroup);
import { MaterialInventory } from "./MaterialInventory";
ibas.boFactory.register(MaterialInventory.BUSINESS_OBJECT_CODE, MaterialInventory);
import { MaterialInventoryJournal } from "./MaterialInventoryJournal";
ibas.boFactory.register(MaterialInventoryJournal.BUSINESS_OBJECT_CODE, MaterialInventoryJournal);
import { Warehouse } from "./Warehouse";
ibas.boFactory.register(Warehouse.BUSINESS_OBJECT_CODE, Warehouse);
import { MaterialBatch } from "./MaterialBatch";
ibas.boFactory.register(MaterialBatch.BUSINESS_OBJECT_CODE, MaterialBatch);
import { MaterialSerial } from "./MaterialSerial";
ibas.boFactory.register(MaterialSerial.BUSINESS_OBJECT_CODE, MaterialSerial);
import { MaterialPriceList } from "./MaterialPriceList";
ibas.boFactory.register(MaterialPriceList.BUSINESS_OBJECT_CODE, MaterialPriceList);
import { MaterialBatchJournal } from "./MaterialBatchJournal";
ibas.boFactory.register(MaterialBatchJournal.BUSINESS_OBJECT_CODE, MaterialBatchJournal);
import { MaterialSerialJournal } from "./MaterialSerialJournal";
ibas.boFactory.register(MaterialSerialJournal.BUSINESS_OBJECT_CODE, MaterialSerialJournal);
