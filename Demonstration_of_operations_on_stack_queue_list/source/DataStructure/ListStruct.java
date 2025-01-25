package source.DataStructure;

import java.util.*;


public class ListStruct extends DataStructure {

    @Override
    public void insert(int value) {
        elements.add(value);
    }
    public void insert(int value, int index) {
        if (index < 0 || index > elements.size()) {
            throw new IndexOutOfBoundsException("Invalid index: " + index);
        }
        elements.add(index, value); 
    }

    @Override
    public void delete(int value) {
        elements.remove((Integer) value);
    }

    @Override
    public boolean find(int value) {
        return elements.contains(value);
    }

    @Override
    public void sort() {
        Collections.sort(elements);
    }


    @Override
    public String getType(){
        return "List";
    }
}