<template advect="my-component" root="light" >
  <datalist>
    <option name="message" value="Unset Message" type="string" set="attr"></option>
  </datalist>
  <h1>Hello World</h1>
    <slot name="stuff">
      <h2>No content</h2>
    </slot>
    <table ref="mytable">
      <thead>
        <tr>
          <td>#</td>
          <td>Name</td>
          <td>Age</td>
          <td>Height</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, pi) in people" :key="pi" :ind="pi">
          <td @click="console.log(di)" :ref="'item_' + di">{{di}}</td>
          <td>{{p.name}}</td>
          <td>{{p.age}}</td>
          <td>{{p.height}} cm</td>
        </tr>
      </tbody>
    <tfoot></tfoot>
  </table>
</template>

<style>
  td {
    padding: 0;
  }
  tr {
    &:hover {
      background-color: blue;
    }
  }
</style>

<script setup>
 const people = [
  {name: "john", age:11, height:49 },
  {name: "Jawn", age:51, height:49 },
  {name: "Cown", age:71, height:49 },

 ]
</script>
